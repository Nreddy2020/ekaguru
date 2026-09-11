import React from "react";
import {render,screen,fireEvent,waitFor} from "@testing-library/react";
import {ConnectBookToGuru} from "./ConnectBookToGuru";
import {guruRequest} from "../../lib/learning/guru-api";
import {connectLocalBook} from "../../lib/learning/guru-upload";
jest.mock("../../lib/learning/guru-api",()=>({guruRequest:jest.fn()}));
jest.mock("../../lib/learning/guru-upload",()=>({connectLocalBook:jest.fn()}));
afterEach(()=>{jest.clearAllMocks();localStorage.removeItem("token");});
it("requires sign-in without transferring the PDF",()=>{
 render(<ConnectBookToGuru bookId="book-a" onClose={()=>{}} onConnected={()=>{}}/>);
 expect(screen.getByRole("link",{name:"Sign in to connect this book"})).toBeInTheDocument();
 expect(guruRequest).not.toHaveBeenCalled();expect(connectLocalBook).not.toHaveBeenCalled();
});
it("requires explicit learner selection and save before connecting",async()=>{
 localStorage.setItem("token","test");(guruRequest as jest.Mock).mockResolvedValue({data:[{id:"child",name:"Learner One"}]});
 (connectLocalBook as jest.Mock).mockResolvedValue({materialId:"material-owned"});
 const connected=jest.fn();render(<ConnectBookToGuru bookId="book-a" onClose={()=>{}} onConnected={connected}/>);
 await screen.findByRole("option",{name:"Learner One"});
 const save=screen.getByRole("button",{name:"Save PDF and open Guru"});expect(save).toBeDisabled();
 expect(connectLocalBook).not.toHaveBeenCalled();
 fireEvent.change(screen.getByLabelText("Learner for this book"),{target:{value:"child"}});fireEvent.click(save);
 await waitFor(()=>expect(connected).toHaveBeenCalledWith("material-owned"));
});
