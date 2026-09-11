export function authSigningSecret(){
 const secret=process.env.JWT_SECRET||(process.env.NODE_ENV==="test"?"ekaguru-secret-key-change-in-production":"");
 if(!secret||(process.env.NODE_ENV!=="test"&&(secret.length<32||/change-in-production|your.secret|replace.me/i.test(secret))))throw new Error("Configure JWT_SECRET with a strong random server-only value before starting authentication.");
 return secret;
}
