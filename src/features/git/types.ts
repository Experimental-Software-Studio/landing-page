export interface GitHistoryCommit {
  hash: string;
  shortHash: string;
  subject: string;
  author: string;
  date: string;
  refs: string[];
}
