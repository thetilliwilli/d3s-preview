import { TypedUseSelectorHook, useDispatch, useSelector, useStore } from "react-redux";
import { AppDispatchType, AppStoreType, RootStateType } from "./store";

/** создаем типизированный алиас для useSelector который понимает что тип = RootStateType */
export const useAppSelector: TypedUseSelectorHook<RootStateType> = useSelector;

/** создаем типизированный алиас для useDispatch */
export const useAppDispatch = () => useDispatch<AppDispatchType>();

/** создаем типизированный алиас для useStore */
export const useAppStore: () => AppStoreType = useStore;
