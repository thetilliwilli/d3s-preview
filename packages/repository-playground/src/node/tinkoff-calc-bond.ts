import { NodeBuilder } from "@d3s/runtime";
import { TinkoffService } from "../service/tinkoff-service.js";

export const tinkoffCalcBond = new NodeBuilder()
  .withInput({
    comission: 0,
    tax: 0.13,
    enableTax: false,
    price: 0,
    bond: {} as any,
    coupons: [] as any[],
    calc: null,
  })
  .withOutput({
    daysToMaturity: 0,
    profit: 0,
    profitPercent: 0,
    profitPercentPerDay: 0,
  })
  .withHandlers({
    calc({ input, signal, emit }) {
      const now = new Date();
      const maturityDate = new Date(input.bond.maturityDate);
      const daysToMaturity = (maturityDate.getTime() - now.getTime()) / 1000 / 60 / 60 / 24;

      const nominalPrice = TinkoffService.toPrice(input.bond.nominal);
      const buyPrice = (nominalPrice / 100) * input.price; //Пункты цены для котировок облигаций представляют собой проценты номинала облигации
      const spendings = buyPrice + TinkoffService.toPrice(input.bond.aciValue) + buyPrice * (input.comission / 100);

      const couponIncome = input.coupons
        .filter((x) => new Date(x.fixDate) > now)
        .map((x) => TinkoffService.toPrice(x.payOneBond))
        .reduce((a, v) => a + v, 0);
      const income = nominalPrice + couponIncome;

      const profit = (income - spendings) * ((100 - (input.enableTax ? input.tax : 0)) / 100);
      const profitPercent = (profit / spendings) * 100;
      const profitPercentPerDay = profitPercent / daysToMaturity;
      emit("daysToMaturity", daysToMaturity);
      emit("profit", profit);
      emit("profitPercent", profitPercent);
      emit("profitPercentPerDay", profitPercentPerDay);
    },
  });
