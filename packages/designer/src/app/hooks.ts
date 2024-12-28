import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import { AppDispatchType, RootStateType } from "./store";

/** создаем типизированный алиас для useSelector который понимает что тип = RootStateType */
export const useAppSelector: TypedUseSelectorHook<RootStateType> = useSelector;

/** создаем типизированный алиас для useDispatch */
export const useAppDispatch = () => useDispatch<AppDispatchType>();
