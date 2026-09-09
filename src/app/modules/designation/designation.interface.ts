import { DesignationScope } from "../../access";

export interface IDesignation {
  name: string;
  description?: string;
  is_active: boolean;
  /**
   * Which group of people this designation is for. Keeps each form's dropdown
   * to the list that belongs to it — an accountant is never offered
   * "Lettings Agent".
   */
  scope: DesignationScope;
}
