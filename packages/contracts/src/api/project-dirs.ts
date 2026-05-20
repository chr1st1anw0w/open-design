export interface ProjectDirsConfig {
  skillsDirs: string[];
  designSystemsDirs: string[];
}

export interface GetProjectDirsResponse extends ProjectDirsConfig {}
export interface SetProjectDirsRequest extends Partial<ProjectDirsConfig> {}
export interface SetProjectDirsResponse extends ProjectDirsConfig {}
