import type { BirthInfo } from "./birth";

export type Profile = {
  id: string;
  birthInfo: BirthInfo;
  createdAt: string;
  updatedAt: string;
};
