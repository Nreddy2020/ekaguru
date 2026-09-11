import React from "react";
import {render,screen,fireEvent,waitFor} from "@testing-library/react";
import LoginPage from "./page";
const originalLocation=window.location;
const assign=jest.fn();
beforeAll(()=>{delete (window as any).location;(window as any).location={origin:"http://localhost:3001",search:"?returnTo=%2Flibrary%2Fbook-test%3Fpage%3D46",assign};});
afterAll(()=>{(window as any).location=originalLocation;});
afterEach(()=>{jest.clearAllMocks();localStorage.clear();});
it("stores only a verified sign-in and returns to the opened page",async()=>{
 global.fetch=jest.fn().mockResolvedValue({ok:true,json:async()=>({access_token:"verified-test-token",user:{authVersion:2,role:"PARENT"}})});
 render(<LoginPage/>);fireEvent.change(screen.getByLabelText("Email"),{target:{value:"parent@example.invalid"}});fireEvent.change(screen.getByLabelText("Password"),{target:{value:"a-long-test-password"}});
 fireEvent.click(screen.getByRole("button",{name:"Sign in"}));
 await waitFor(()=>expect(assign).toHaveBeenCalledWith("/library/book-test?page=46"));
 expect(localStorage.getItem("token")).toBe("verified-test-token");
});
it("does not accept a legacy unverified login response",async()=>{
 global.fetch=jest.fn().mockResolvedValue({ok:true,json:async()=>({access_token:"legacy",user:{role:"ADMIN"}})});
 render(<LoginPage/>);fireEvent.submit(screen.getByRole("button",{name:"Sign in"}).closest("form")!);
 expect(await screen.findByRole("alert")).toHaveTextContent("could not be verified");expect(localStorage.getItem("token")).toBeNull();expect(assign).not.toHaveBeenCalled();
});
it("does not redirect to another origin after login",async()=>{
 (window.location as any).search="?returnTo=https%3A%2F%2Foutside.example";
 global.fetch=jest.fn().mockResolvedValue({ok:true,json:async()=>({access_token:"verified",user:{authVersion:2}})});
 render(<LoginPage/>);fireEvent.submit(screen.getByRole("button",{name:"Sign in"}).closest("form")!);
 await waitFor(()=>expect(assign).toHaveBeenCalledWith("/learn"));
});

