import { configureStore } from "@reduxjs/toolkit";
import { networkSlice } from "../slice/network-slice";
import { uiSlice } from "../slice/ui-slice";
import { bindingSlice } from "../slice/binding-slice";

export const store = configureStore({
  reducer: {
    network: networkSlice.reducer,
    ui: uiSlice.reducer,
    binding: bindingSlice.reducer
  },
});

/** тип который определяет dataShape всего состояния нашего приложения
 * после слияния всех редюсеров, которые мы передали внутрь метода configureStore
 * его нужно получать таким образом, потому что только после вызова configureStore и получения результата
 * у нас на руках появляется финальный dataShape состояния */
export type RootStateType = ReturnType<typeof store.getState>;

/** тип нашей диспатч функции */
export type AppDispatchType = typeof store.dispatch;