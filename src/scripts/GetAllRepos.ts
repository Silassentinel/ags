// this file will contain all functions to get all the public github repos from a specific user
import fs from 'fs'
import dotenv from 'dotenv';
dotenv.config();
const jsonData  = fs.readFileSync(".\\data\\ghuserRepo.json", "utf-8");

const GetAllRepos = async (username: string): Promise<Array<any>> => {
    // if in dev use local json file else call api
    if (process.env.NODE_ENV === "development") {
        return JSON.parse(jsonData);
    }
   else  return await( await fetch(`https://api.github.com/users/${username}/repos`)).json();
};
 
export default GetAllRepos;