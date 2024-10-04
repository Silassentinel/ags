/**
 * @typedef {Object} Repo
 * @property {number} id
 * @property {string} name
 * @property {string} description
 * @property {string} update_at
 * @property {string} svn_url
 * Represents a github repo
 */
export type Repo = {
    id: number;
    name: string;
    description: string;
    update_at: string;
    svn_url: string;
};
/* 
{ description: string | null; id: number; name: unknown; svn_url: string | URL | null | undefined; }
(firstRepo: { update_at: string; },nextRepo: { update_at: string; }  */