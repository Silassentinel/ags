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