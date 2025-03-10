import { DataKey } from "@d3s/state";
import { useEffect, useState } from "react";
import { dataCache } from "../../service/data-cache";

export function useViews(viewableInputs: { name: string; dataKey: DataKey }[]) {
  const [views, setViews] = useState<
    {
      name: string;
      dataKey: DataKey;
      value: any;
    }[]
  >([]);

  useEffect(() => {
    const viewDataKeys = viewableInputs.map((x) => x.dataKey);

    function updateAllViews() {
      dataCache.getDatakeyValuesAsync(viewDataKeys).then((viewContents) => {
        const newViews = viewContents.map((viewContent) => ({
          ...viewContent,
          name: viewableInputs.find((x) => x.dataKey === viewContent.dataKey)!.name,
        }));

        setViews(newViews);
      });
    }

    updateAllViews();

    // hack
    viewDataKeys.forEach((dataKey) => dataCache.on(dataKey, updateAllViews));

    return () => {
      viewDataKeys.forEach((dataKey) => dataCache.off(dataKey, updateAllViews));
    };
  }, [viewableInputs]);

  return views;
}
