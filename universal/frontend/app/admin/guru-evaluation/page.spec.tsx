import React from "react";
import {render,screen,fireEvent,waitFor} from "@testing-library/react";
import GuruEvaluationPage from "./page";
import {guruRequest} from "../../../lib/learning/guru-api";
jest.mock("../../../lib/learning/guru-api",()=>({...jest.requireActual("../../../lib/learning/guru-api"),guruRequest:jest.fn()}));
const rubric={version:1,passMinimum:3,minimumPassedCases:20,criteria:[
 {id:"source_coverage",title:"Source coverage",question:"Covers the page?",weight:1},
 {id:"factual_accuracy",title:"Factual accuracy",question:"Correct?",weight:1.5,gate:true},
]};
const summary={rubricVersion:1,minimumPassedCases:20,totalCases:2,groups:[{subject:"Science",depth:"basis",language:"en",cases:2,prepared:1,reviewed:0,passed:0,failed:0}],approvedDepths:[]};
const cases=[
 {id:"case-a",bookId:"science-class-6",physicalPage:12,subject:"Science",gradeBand:"MIDDLE_SCHOOL",language:"en",depth:"basis",prepared:true,reviewCount:0,consensus:"UNREVIEWED",meanWeightedScore:null},
 {id:"case-b",bookId:"science-class-6",physicalPage:28,subject:"Science",gradeBand:"MIDDLE_SCHOOL",language:"en",depth:"deep",prepared:false,reviewCount:0,consensus:"UNREVIEWED",meanWeightedScore:null},
];
const packet={case:{...cases[0],artifactId:"artifact-123456789",sourceHash:"hash-123456789"},rubric,lesson:{objectives:["Explain evaporation"],actions:[{id:"action-0",kind:"ask",text:"Why does water vanish?",speech:"Think.",evidenceIds:["vision-0"],rubric:{expected:"It evaporates",criteria:["Names evaporation"],hint:"Heat",misconception:"It disappears"}}]},page:{blocks:[{blockId:"vision-0",type:"paragraph",confidence:0.95,text:"Water evaporates when heated."}]},audit:{model:"gemini:test",reviewedAt:"2026-09-11"},reviews:[]};
const mappingsState:{list:any[]}={list:[]};
function api(overrides:Record<string,any>={}){
 mappingsState.list=overrides.mappings||[];
 (guruRequest as jest.Mock).mockImplementation(async(path:string,body?:unknown)=>{
  if(path.endsWith("/concept-mappings/propose")){mappingsState.list=[{id:"m1",conceptId:"c1",method:"CHUNK_PAGE_RANGE",score:0.72,status:"PROPOSED",rationale:"Chunk covers page 12",concept:{id:"c1",canonicalName:"Evaporation",domain:"Science"}}];return mappingsState.list;}
  if(path.endsWith("/concept-mappings")&&body===undefined)return mappingsState.list;
  if(path.endsWith("/concept-mappings")&&body){mappingsState.list=[...mappingsState.list,{id:"m2",conceptId:(body as any).conceptId,method:"MANUAL",score:1,status:"VERIFIED",rationale:(body as any).rationale,concept:{id:(body as any).conceptId,canonicalName:"Water cycle",domain:"Science"}}];return mappingsState.list[mappingsState.list.length-1];}
  if(/\/concept-mappings\/[^/]+\/review$/.test(path)){mappingsState.list=mappingsState.list.map(m=>path.includes(m.id)?{...m,status:(body as any).status}:m);return {};}
  if(path.startsWith("/api/v2/guru/concepts?search="))return [{id:"c9",canonicalName:"Water cycle",domain:"Science",gradeBand:"PRIMARY"}];
  if(path.endsWith("/prepare"))return {caseId:"case-b",job:{id:"artifact:artifact-999",status:"DONE",stage:"done",artifactId:"artifact-999"}};
  if(path.endsWith("/summary"))return summary;
  if(path.endsWith("/cases"))return cases;
  if(path.endsWith("/rubric"))return rubric;
  if(path.endsWith("/packet"))return overrides.packet||packet;
  if(path.endsWith("/reviews"))return {verdict:"FAIL",weightedScore:0.7,body};
  throw new Error("unexpected "+path);
 });
}
beforeEach(()=>{localStorage.setItem("token","curator");api();});
afterEach(()=>{jest.clearAllMocks();localStorage.clear();});

it("requires a signed-in curator before loading anything",()=>{
 localStorage.clear();render(<GuruEvaluationPage/>);
 expect(screen.getByRole("alert")).toHaveTextContent("Sign in with a curator");
 expect(guruRequest).not.toHaveBeenCalled();
});
it("lists the corpus, filters by depth and opens a packet with server-held rubrics",async()=>{
 render(<GuruEvaluationPage/>);
 await screen.findByText("2 cases · rubric v1 · 20 consensus passes needed per depth and language");
 expect(screen.getByText("No depth has reached the approval threshold yet.")).toBeInTheDocument();
 fireEvent.change(screen.getByLabelText("Filter by depth"),{target:{value:"deep"}});
 expect(screen.getByText("1 shown")).toBeInTheDocument();
 fireEvent.change(screen.getByLabelText("Filter by depth"),{target:{value:""}});
 fireEvent.click(screen.getByRole("button",{name:"Open science-class-6 p12 basis"}));
 await screen.findByText("Explain evaporation");
 expect(screen.getByText("Expected: It evaporates")).toBeInTheDocument();
 expect(screen.getByText(/A model review is not educator certification/)).toBeInTheDocument();
});
it("submits rubric scores and shows the reconciled verdict",async()=>{
 render(<GuruEvaluationPage/>);
 await screen.findByRole("button",{name:"Open science-class-6 p12 basis"});
 fireEvent.click(screen.getByRole("button",{name:"Open science-class-6 p12 basis"}));
 await screen.findByRole("button",{name:"Save review"});
 fireEvent.change(screen.getByLabelText("Factual accuracy"),{target:{value:"1"}});
 expect(screen.getByText(/scores allow FAIL/)).toBeInTheDocument();
 fireEvent.change(screen.getByLabelText("Review notes"),{target:{value:"Diagram mislabels the root."}});
 fireEvent.click(screen.getByRole("button",{name:"Save review"}));
 await screen.findByText("Review saved: FAIL (weighted 70%)");
 const call=(guruRequest as jest.Mock).mock.calls.find(([path])=>path.endsWith("/reviews"));
 expect(call[0]).toBe("/api/v2/guru/evaluation/cases/case-a/reviews");
 expect(call[1]).toEqual({scores:{source_coverage:3,factual_accuracy:1},notes:"Diagram mislabels the root."});
});
it("explains that unprepared cases need a configured provider",async()=>{
 api({packet:{...packet,case:{...cases[1],artifactId:null,sourceHash:null},lesson:null,page:null,audit:null}});
 render(<GuruEvaluationPage/>);
 await screen.findByRole("button",{name:"Open science-class-6 p28 deep"});
 fireEvent.click(screen.getByRole("button",{name:"Open science-class-6 p28 deep"}));
 await screen.findByText(/requires a configured Guru provider key/);
 expect(screen.queryByRole("button",{name:"Save review"})).toBeNull();
 expect(screen.getByRole("button",{name:"Prepare lesson"})).toBeInTheDocument();
});
it("lets a curator propose, verify and manually link concept mappings for a prepared lesson",async()=>{
 render(<GuruEvaluationPage/>);
 await screen.findByRole("button",{name:"Open science-class-6 p12 basis"});
 fireEvent.click(screen.getByRole("button",{name:"Open science-class-6 p12 basis"}));
 await screen.findByText("No mappings yet.");
 fireEvent.click(screen.getByRole("button",{name:"Propose from extraction"}));
 await screen.findByText("Evaporation");
 expect(screen.getByText("PROPOSED")).toBeInTheDocument();
 fireEvent.click(screen.getByRole("button",{name:"Verify Evaporation"}));
 await screen.findByText("Mapping verified: Evaporation");
 expect(screen.getByText("VERIFIED")).toBeInTheDocument();
 const reviewCall=(guruRequest as jest.Mock).mock.calls.find(([path])=>path==="/api/v2/guru/concept-mappings/m1/review");
 expect(reviewCall[1]).toEqual({status:"VERIFIED"});
 fireEvent.change(screen.getByLabelText("Search concepts"),{target:{value:"water"}});
 fireEvent.click(screen.getByRole("button",{name:"Search concepts"}));
 await screen.findByRole("button",{name:"Link Water cycle"});
 fireEvent.click(screen.getByRole("button",{name:"Link Water cycle"}));
 await screen.findByText("Linked and verified: Water cycle");
 const linkCall=(guruRequest as jest.Mock).mock.calls.find(([path,body])=>path==="/api/v2/guru/lessons/artifact-123456789/concept-mappings"&&body);
 expect(linkCall[1]).toMatchObject({conceptId:"c9"});
 expect(screen.getAllByText("VERIFIED")).toHaveLength(2);
});
it("prepares through a durable job and reports the stage",async()=>{
 api({packet:{...packet,case:{...cases[1],artifactId:null,sourceHash:null},lesson:null,page:null,audit:null}});
 render(<GuruEvaluationPage/>);
 await screen.findByRole("button",{name:"Open science-class-6 p28 deep"});
 fireEvent.click(screen.getByRole("button",{name:"Open science-class-6 p28 deep"}));
 await screen.findByRole("button",{name:"Prepare lesson"});
 fireEvent.click(screen.getByRole("button",{name:"Prepare lesson"}));
 await screen.findByText("Lesson prepared: artifact-999");
 expect((guruRequest as jest.Mock).mock.calls.some(([path])=>path==="/api/v2/guru/evaluation/cases/case-b/prepare")).toBe(true);
});
