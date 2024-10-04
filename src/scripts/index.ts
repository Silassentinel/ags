// import type { MarkdownInstance } from "astro";
import type { Identity } from "./Interface/IIdentity";
/**
 * @class Skill
 * A class to represent a skill
 */
export class Skill {
  //#region CTOR
  /**
   * CTOR
   * @param name Name of the skill {string}
   * @param experience Years of experience {number}
   * @param tools Array of tools used {string[]}
   */
  constructor(name: string) {
    this.Name = name;
  }
  //#endregion

  //#region Props
  /**
   * The name of the skill
   */
  Name: string;
  //#endregion

  toString() {
    return this.Name;
  }
}

/**
 * @class SoftSkill
 * @extends Skill
 * A class to represent a soft skill
 */
export class SoftSKill extends Skill {
  //#region CTOR
  /**
   * CTOR
   * @param name Name of the skill {string}
   * @param level Positive or negative level {number}
   */
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

export class TechSkill extends Skill {
  //#region CTOR
  constructor(name: string, experience: number, tools: string[]) {
    super(name);
    this.experience = experience;
    this.Tools = tools;
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
  Tools: string[];
  //#endregion
}

/**
 * List of TechSkills
 */
export const techSkills: TechSkill[] = [
  new TechSkill("FrontEnd Development", 4, ["HTML", "CSS", "JavaScript", "TypeScript", "React", "Astro", "JQuery", "Bootstrap",]),
  new TechSkill("BackEnd Development", 5, ["ASP", "Node", "express"]),
  new TechSkill("Database Development", 4, ["SQL", "MYSQL", "MSSQL", "Firebase"]),
  new TechSkill("Desktop Application Development", 4, ["C#", "VB.Net", "Entity Framework", "Ado.Net", "WPF"]),
  new TechSkill("Mobile Development", 4, ["React Native"]),
  new TechSkill("Testing", 4, ["Jest", "mocha", "chai", "MSTest", "NUnit"]),
  new TechSkill("DevOps", 4, ["Azure DevOps", "CICD" ,"GitHub", "YAML"]),
  new TechSkill("Automation", 4, ["PowerShell", "Ansible", "Python", "Bash", "UIPath", "BluePrism", "PowerAutomate"]),
];


/*TechSkills
  DotNet Core
  C#/VB.net
  ASP.net, Ado.Net Entity Framework
  SQL, Mysql, MSSQL, firebase/li>
  HTML5, CSS3
  JQuery, Javascript, Typescript, Appsscript
  React-Web, React-Native, Astro, Vite, Turbo
*/

export const softSkills: SoftSKill[] = [
  new SoftSKill("Eager to learn", 10),
  new SoftSKill("Team & soloplayer", 10),
  new SoftSKill("Training, guiding, evaluating team(s)", 7),
  new SoftSKill("Challenging status quo", 10),
  new SoftSKill("Problem solver There are no problems only solutions", 10),
  new SoftSKill("Security enthusiast", 10),
  new SoftSKill("Detail-oriented", 2),
];

/* softskills
Eager to learn
Team & soloplayer
Training, guiding, evaluating team(s)
Problem solver There are no problems only solution
Security enthusiast
Unhappy to cut corners
*/


/**
 * State of mind
 */
export const happy: Boolean = true;

/**
 * Finished
 */
export const finished: Boolean = true;

/**
 * Goal
 */
export const goal: Number = 9000;


/**
 * Identity interface
 */
export const identity: Identity = {
  firstName: "Benjamin",
  country: "Belgium",
  occupation: "Software automation engineer",
  hobbies: ["Learning new tech", "cooking", "gardening", "family"],
  softSkills,
  techSkills,
};

