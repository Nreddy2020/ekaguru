import {connectLocalBook} from "./guru-upload";
import {LocalBookSourceStore} from "./local-book-source";
import {BookStorageService} from "./book-storage.service";
const digest=new Uint8Array(32).fill(7).buffer;
const checksum="07".repeat(32);
const book:any={id:"book-upload-test",title:"My PDF",subject:"EVS",grade:"CLASS 5",fileName:"original.pdf"};
beforeEach(()=>{
 localStorage.setItem("token","test-token");
 jest.spyOn(BookStorageService,"getBooks").mockReturnValue([book]);
 jest.spyOn(BookStorageService,"updateBook").mockImplementation(()=>{});
 const file=new Blob(["original"]);Object.defineProperty(file,"arrayBuffer",{value:async()=>new ArrayBuffer(8)});
 jest.spyOn(LocalBookSourceStore,"get").mockResolvedValue(file);
 Object.defineProperty(global.crypto,"subtle",{configurable:true,value:{digest:jest.fn().mockResolvedValue(digest)}});
 global.fetch=jest.fn().mockResolvedValue({ok:true,json:async()=>({data:{id:"material-verified",learnerId:"learner",checksum,fileSizeBytes:8}})});
});
afterEach(()=>{jest.restoreAllMocks();localStorage.removeItem("token");});
it("sends the original as multipart and links only a verified owned source",async()=>{
 await expect(connectLocalBook(book.id,"learner","test-token",new AbortController().signal)).resolves.toEqual({materialId:"material-verified"});
 const [url,options]=(fetch as jest.Mock).mock.calls[0];
 expect(url).toContain("/learning-materials/upload");expect(options.body).toBeInstanceOf(FormData);
 expect(options.body.get("file").name).toBe("original.pdf");
 expect(options.body.get("learnerId")).toBe("learner");
 expect(options.headers["Content-Type"]).toBeUndefined();
 expect(BookStorageService.updateBook).toHaveBeenCalledWith(expect.objectContaining({guruMaterial:{id:"material-verified",learnerId:"learner",sourceChecksum:checksum}}));
});
it("rejects a mismatched source hash without changing the local entry",async()=>{
 (fetch as jest.Mock).mockResolvedValue({ok:true,json:async()=>({data:{id:"material",learnerId:"learner",checksum:"wrong",fileSizeBytes:8}})});
 await expect(connectLocalBook(book.id,"learner","test-token",new AbortController().signal)).rejects.toThrow("could not be verified");
 expect(BookStorageService.updateBook).not.toHaveBeenCalled();
});
it("rejects oversized PDFs before transmission",async()=>{
 (LocalBookSourceStore.get as jest.Mock).mockResolvedValue({size:51*1024*1024});
 await expect(connectLocalBook(book.id,"learner","test-token",new AbortController().signal)).rejects.toThrow("50 MB");
 expect(fetch).not.toHaveBeenCalled();
});
it("does not upload after cancellation or an account change",async()=>{
 const controller=new AbortController();controller.abort();
 await expect(connectLocalBook(book.id,"learner","test-token",controller.signal)).rejects.toThrow("cancelled");
 expect(fetch).not.toHaveBeenCalled();
 localStorage.setItem("token","different");
 await expect(connectLocalBook(book.id,"learner","test-token",new AbortController().signal)).rejects.toThrow("account changed");
 expect(fetch).not.toHaveBeenCalled();
});
it("preserves the local entry when access is denied",async()=>{
 (fetch as jest.Mock).mockResolvedValue({ok:false,status:403,json:async()=>({})});
 await expect(connectLocalBook(book.id,"learner","test-token",new AbortController().signal)).rejects.toThrow("do not have access");
 expect(BookStorageService.updateBook).not.toHaveBeenCalled();
});
