import { NodeBuilder } from "@d3s/runtime";

type CashRates = {
  phone: string;
  rate: {
    sell: string | null;
    currency: number;
    buy: string | null;
    volume_id: number;
    sum: string;
    num_coeff: number;
    commiss: boolean;
    actual_rate: string;
  };
  reserve_url: string;
  name: string;
  metro: [name: string, line: string, x: number, distance: number, distanceString: string][] | null;
  dt_last_published: string;
  premium_type: string;
  id: number;
  coordinates: [number, number];
  mark: null;
};

type RateReportItem = {
  name: string;
  position: string;
  price: number;
};

type RateReport = {
  items: RateReportItem[];
  itemsDiff: {
    prev: RateReportItem;
    next: RateReportItem;
  }[];
  best: RateReportItem;
};

export const rbcCashParser2 = new NodeBuilder()
  .withInput({
    rates: [] as CashRates[],
  })
  .withOutput({
    buy: {
      items: [],
      itemsDiff: [],
      best: {
        name: "",
        position: "",
        price: 0,
      },
    } as RateReport,
    sell: {
      items: [],
      itemsDiff: [],
      best: {
        name: "",
        position: "",
        price: 0,
      },
    } as RateReport,
  })
  .withHandlers({
    rates({ state, output, signal, emit }) {
      const rates = signal.data;

      const buy = getBest("buy", rates, 5, output.buy);
      const sell = getBest("sell", rates, 5, output.sell);

      emit("buy", buy);
      emit("sell", sell);
    },
  });

function getBest(buyOrSell: "buy" | "sell", items: CashRates[], count: number, baseReport: RateReport): RateReport {
  let rateReportItems = items
    .filter((x) => x.premium_type === null)
    .map((x) => {
      return {
        name: x.name,
        position: x.metro && x.metro[0] ? `${x.metro[0][0]} ${x.metro[0][4]}` : "",
        price: x.rate[buyOrSell] === null ? null : Number.parseFloat(x.rate[buyOrSell]),
      };
    })
    .filter((x): x is RateReportItem => x.price !== null)
    .sort((a, b) => (buyOrSell === "buy" ? -1 : 1) * (a.price - b.price))
    .slice(0, count);

  const best = rateReportItems[0];

  const itemsDiff = baseReport.items.map((prevItem, index) => ({
    prev: prevItem,
    next: rateReportItems[index],
  }));

  return {
    items: rateReportItems,
    itemsDiff,
    best,
  };
}
