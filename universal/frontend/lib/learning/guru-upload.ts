import {BookStorageService} from './book-storage.service';
import {LocalBookSourceStore} from './local-book-source';

export async function connectLocalBook(bookId:string,learnerId:string,token:string,signal:AbortSignal){
  if(!token||!learnerId)throw new Error("Sign in and select a learner first.");
  const book=BookStorageService.getBooks().find(b=>b.id===bookId);
  const file=await LocalBookSourceStore.get(bookId);
  if(!book||!file)throw new Error("Attach the original PDF before connecting to Guru.");
  if(file.size>50*1024*1024)throw new Error("Guru server uploads support PDFs up to 50 MB. Your local book remains available.");
  const digest=await crypto.subtle.digest("SHA-256",await file.arrayBuffer());
  const checksum=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,"0")).join("");
  if(signal.aborted||localStorage.getItem("token")!==token)throw new Error("Connection cancelled or account changed. Reopen Connect to Guru.");
  const form=new FormData();
  form.append("file",file,book.fileName||"textbook.pdf");
  form.append("learnerId",learnerId);form.append("title",book.title);
  form.append("materialType","TEXTBOOK");form.append("subjectName",book.subject);form.append("gradeLevel",book.grade);
  const response=await fetch((process.env.NEXT_PUBLIC_API_URL||"http://127.0.0.1:20000")+"/api/v2/learning-materials/upload",{method:"POST",headers:{Authorization:"Bearer "+token},body:form,signal});
  const payload=await response.json().catch(()=>null);
  if(!response.ok)throw new Error(response.status===401?"Sign in again to connect this book.":response.status===403?"You do not have access to the selected learner.":response.status===413?"This PDF exceeds the server upload limit.":typeof payload?.message==="string"?payload.message:"The original PDF could not be uploaded. Please retry.");
  const result=payload?.data;
  if(!result||typeof result.id!=="string"||!new RegExp("^[A-Za-z0-9_-]{1,128}$").test(result.id)||result.learnerId!==learnerId||result.checksum!==checksum||result.fileSizeBytes!==file.size)throw new Error("The uploaded source could not be verified. Your local book is unchanged.");
  if(signal.aborted||localStorage.getItem("token")!==token)throw new Error("Connection cancelled or account changed. Your local book is unchanged.");
  BookStorageService.updateBook({...book,guruMaterial:{id:result.id,learnerId,sourceChecksum:checksum}});
  return {materialId:result.id as string};
}
