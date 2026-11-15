import {createContext,useContext} from 'react';
export type Workspace={id:string;name:string;role:string};
export const WorkspaceContext=createContext<{org:Workspace;userId:string;refresh:()=>void}>({org:{id:'',name:'',role:''},userId:'',refresh:()=>{}});
export const useWorkspace=()=>useContext(WorkspaceContext);
