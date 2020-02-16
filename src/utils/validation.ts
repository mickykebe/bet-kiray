import * as Yup from "yup";
import { HouseAvailableFor, HouseType } from "./values";

export const houseAvailabilityValidator = Yup.string()
  .required("Required")
  .oneOf(Object.keys(HouseAvailableFor), "Invalid Availability");

export const houseTypeValidator = Yup.string()
  .required("Required")
  .oneOf(Object.keys(HouseType), "Invalid House Type");
