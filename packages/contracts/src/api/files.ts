import type { OkResponse } from '../common.js';
import type { ArtifactKind, ArtifactManifest } from './artifacts.js';

export type ProjectFileKind =
  | 'html'
  | 'image'
  | 'video'
  | 'audio'
  | 'sketch'
  | 'text'
  | 'code'
  | 'pdf'
  | 'document'
  | 'presentation'
  | 'spreadsheet'
  | 'binary';

export interface ProjectFile {
  name: string;
  path?: string;
  type?: 'file' | 'dir';
  size: number;
  mtime: number;
  kind: ProjectFileKind;
  mime: string;
  artifactKind?: ArtifactKind;
  artifactManifest?: ArtifactManifest;
}

export interface ProjectFolder {
  name: string;
  path: string;
  type: 'folder';
}

export interface ProjectFilesResponse {
  files: ProjectFile[];
  folders?: ProjectFolder[];
}

export interface CreateProjectFolderRequest {
  name: string;
}

export interface CreateProjectFolderResponse {
  folder: ProjectFolder;
}

export interface RenameProjectFolderRequest {
  from: string;
  to: string;
}

export interface RenameProjectFolderResponse {
  oldName: string;
  newName: string;
}

export interface DeleteProjectFolderResponse extends OkResponse {}

export interface ProjectFileResponse {
  file: ProjectFile;
}

export interface UploadProjectFilesResponse extends ProjectFilesResponse {}

export interface DeleteProjectFileResponse extends OkResponse {}

export interface RenameProjectFileRequest {
  from: string;
  to: string;
}

export interface RenameProjectFileResponse {
  file: ProjectFile;
  oldName: string;
  newName: string;
}
