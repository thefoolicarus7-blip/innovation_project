import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "./index";

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export function useAppSelector<TSelected>(selector: (state: RootState) => TSelected): TSelected {
	return useSelector((state: unknown) => selector(state as RootState));
}
