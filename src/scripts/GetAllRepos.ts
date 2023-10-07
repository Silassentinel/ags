// this file will contain all functions to get all the public github repos from a specific user

const GetAllRepos = async (username: string) => {
    return await( await fetch(`https://api.github.com/users/${username}/repos`)).json();
};
 
export default GetAllRepos;