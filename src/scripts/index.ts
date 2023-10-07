/**
 * A class to represent a skill
 */
class Skill {
  //#region CTOR
  /**
   * 
   * @param name Name of the skill {string}
   * @param experience Years of experience {number}
   * @param tools Array of tools used {string[]}
   */
  constructor(name: string) {
    this.name = name;
  }
  //#endregion

  //#region Props
  /**
   * The name of the skill
   */
  name: string;
  //#endregion

}

class SoftSKill extends Skill {
  //#region CTOR
  constructor(name: string, level : number) {
    super(name);
    this.level = level;
  }
  //#endregion
  //#region Props
  /**
   * Postif or negatif level
   */
  level: number;
  //#endregion
}

class TechSkill extends Skill {
  //#region CTOR
  constructor(name: string, experience: number, tools: string[]) {
    super(name);
    this.experience = experience;
    this.tools = tools;
  }
  //#endregion
  //#region Props
  /**
   * The years of experience
   */
  experience: number;
  /**
   * The tools used
   */
  tools: string[];
  //#endregion
}

export const identity: Identity = {
  firstName: "Benjamin",
  country: "Belgium",
  occupation: "Software automation engineer",
  hobbies: ["Learning new tech", "cooking", "gardening", "family"],
};

export const Skills: Skill[] = [
  new Skill("FrontEnd Development", 3, ["HTML", "CSS", "JavaScript", "TypeScript", "React", "Astro", "JQuery", "Bootstrap",]),
  new Skill("BackEnd Development", 3, ["ASP", "node", "express"]),
  new Skill("Database Development", 3, ["SQL", "MYSQL", "MSSQL", "Firebase"]),
  new Skill("Desktop Application Development", 3, ["C#", "VB.Net", "Entity Framework", "Ado.Net", "WPF"]),
  new Skill("Mobile Development", 3, ["React Native"]),
  new Skill("Testing", 3, ["Jest", "mocha", "chai", "MSTest", "NUnit"]),
  new Skill("DevOps", 3, ["Azure DevOps", "GitHub", "YAML"]),
  new Skill("Automation", 3, ["PowerShell", "Python", "Bash", "UIPath", "BluePrism", "PowerAutomate"]),
];


/*
TechSkills


    DotNet Core
    C#/VB.net
    ASP.net, Ado.Net Entity Framework
    SQL, Mysql, MSSQL, firebase/li>
    HTML5, CSS3
    JQuery, Javascript, Typescript, Appsscript
    React-Web, React-Native, Astro, Vite, Turbo

*/


/* softskills
Eager to learn
Team & soloplayer
Training, guiding, evaluating team(s)
Social
Problem solver There are no problems only solution
*/


export const happy: Boolean = true;

export const finished: Boolean = true;

export const goal: Number = 9000;