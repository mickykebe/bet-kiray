import * as Yup from "yup";
import { HouseAvailableFor, HouseType } from "./values";

export const houseAvailabilityValidator = Yup.string()
  .required("Required")
  .oneOf(
    Object.keys(HouseAvailableFor).map(
      key => HouseAvailableFor[key as keyof typeof HouseAvailableFor]
    ),
    "Invalid Availability"
  );

export const houseTypeValidator = Yup.string()
  .required("Required")
  .oneOf(
    Object.keys(HouseType).map(key => HouseType[key as keyof typeof HouseType]),
    "Invalid House Type"
  );

export const roomsValidator = Yup.number().min(1);
export const bathroomsValidator = Yup.number().min(1);

export const titleValidator = Yup.string().required("Required");
