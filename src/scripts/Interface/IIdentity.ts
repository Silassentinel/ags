import type { Skill, SoftSKill, TechSkill } from "..";

/**
 * @interface Identity
 * An interface to represent an identity
 */
export interface Identity {
    /**
     * The first name of the person
     * @type {string}
     */
    firstName: string;
    /**
     * Country of the person
     * @type {string}
     */
    country: string;
    /**
     * The occupation of the person
     * @type {string}
     */
    occupation: string;
    /**
     * The hobbies of the person
     * @type {string[]}
     */
    hobbies: string[];
    /**
     * The soft skills of the person
     * @type {SoftSkill[]}
     */
    softSkills: SoftSKill[];
    /**
     * The tech skills of the person
     * @type {TechSkill[]}
     */
    techSkills: TechSkill[];
}