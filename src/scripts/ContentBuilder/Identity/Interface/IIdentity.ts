import type { SkillType, SoftSkillType, TechSkillType } from "../core/Skills";
import { SoftSKill, TechSkill } from "../core/Skills";

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
     * @type {SoftSKill[]}
     */
    softSkills: SoftSKill[];
    /**
     * The tech skills of the person
     * @type {TechSkill[]}
     */
    techSkills: TechSkill[];
}