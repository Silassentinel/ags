// this file will contain all functions to get all the public github repos from a specific user
import fs from 'fs';
import dotenv from 'dotenv';
import type { Repo } from './types/Repo';

dotenv.config();
const jsonData = fs.readFileSync("./data/ghuserRepo.json", "utf8");

const GetAllRepos = async (username: string): Promise<Array<Repo>> => {
    // if in dev use local json file else call api
    if (process.env.NODE_ENV === "development") {
        return JSON.parse(jsonData);
    }
    else return await (await fetch(`https://api.github.com/users/${username}/repos`)).json();
};

export default GetAllRepos;