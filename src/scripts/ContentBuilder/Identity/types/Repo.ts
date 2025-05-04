/**
 * @typedef {Object} Repo
 * @property {number} id
 * @property {string} name
 * @property {string} description
 * @property {string} update_at
 * @property {string} svn_url
 * @property {string} html_url
 * Represents a github repo
 */
export type Repo = {
    id: number;
    name: string;
    description: string;
    update_at: string;
    svn_url: string;
    pushed_at: string;
    html_url?: string; // Added as optional property
};
/* 
{ description: string | null; id: number; name: unknown; svn_url: string | URL | null | undefined; }
(firstRepo: { update_at: string; },nextRepo: { update_at: string; }  */