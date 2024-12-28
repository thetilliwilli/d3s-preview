interface TextFormatterOptions {
  escapeCharacter: string;
  contextPrefix: string;
  predefinedVariables: string[];
}

interface FormatterContext {
  [variableName: string]: any;
}

/**
 * Предоставляет функционал по форматированию строк
 * Например формула вида <@value + ",кг"> будет преобразована в строку <"13,кг"> (при значение @value равном 13)
 */
export class TextFormatter {
  private options: TextFormatterOptions = {
    escapeCharacter: "@",
    contextPrefix: "_ctx_",
    predefinedVariables: [],
  };
  private compiledRegExp: RegExp;
  private formatterString: string;
  private preMatches: string[];
  private contextifiedFormatterString: string;
  private compiledFunction: Function;

  constructor(formatterString: string, options?: TextFormatterOptions) {
    if (typeof formatterString !== "string")
      throw new Error("Обязательный аргумент formatterString должен быть задан строкой");

    if (options) Object.assign(this.options, options);
    // this._applyOptions(options);
    const { escapeCharacter, contextPrefix, predefinedVariables } = this.options;

    //если есть заявленные переменные то используем их в поиске (объединяем через OR)
    //если нету заявленных переменных то используем общий шаблон поиска
    var pattern =
      predefinedVariables.length === 0
        ? `${escapeCharacter}([a-zA-Z]+)`
        : `${escapeCharacter}(${predefinedVariables.join("|")})`;

    this.compiledRegExp = new RegExp(pattern, "g");

    this.formatterString = formatterString;

    //убираем префикс
    this.preMatches = (formatterString.match(this.compiledRegExp) || []).map((match) =>
      match.slice(escapeCharacter.length)
    );

    this.contextifiedFormatterString = this.preMatches
      ? formatterString.replace(this.compiledRegExp, ` ${contextPrefix}.$1`)
      : formatterString;

    this.compiledFunction = this.compileFunction();
  }

  /**
   * Выполнить formatter в условиях заданного контекста
   * @param {*} formatterContext run-time контекст в котором будет исполняться formatter. Содержит текущие значения переменных для формулы
   */
  public formatAgainstContext(formatterContext: FormatterContext) {
    //нету совпадений значит нечего подменять - отдаем строку без изменений
    if (!this.preMatches) return this.formatterString;

    //ищем параметры которых не существует в переданном контексте
    const firstMismatch = this.findMismatch(formatterContext);
    if (firstMismatch) return `Несуществующий параметр: @${firstMismatch}`;

    //компилим объект содержащий контекст и исполняем относительно него формирование итоговой строки.
    try {
      //создаем чистый объект без прототипа что бы не было лишних свойств
      var compiledContext = Object.assign(Object.create(null), formatterContext);
      var result = this.compiledFunction(compiledContext);
      return this.stringifyResult(result);
    } catch (error) {
      return this.formatterString;
    }
  }

  private findMismatch(formatterContext: FormatterContext) {
    for (let match of this.preMatches) if (!Object.prototype.hasOwnProperty.call(formatterContext, match)) return match;
    return null;
  }

  private stringifyResult(result: unknown) {
    return "" + result;
  }

  private compileFunction() {
    const formatterString = this.formatterString;

    //возвращаем функцию которая будет всегда возвращать строку без изменений
    if (!this.preMatches) return () => formatterString;

    //имя параметра функции не может называться this
    const contextPrefix = this.options.contextPrefix.trim() === "this" ? "" : this.options.contextPrefix;

    try {
      return new Function(contextPrefix, `"use strict";return (${this.contextifiedFormatterString})`);
    } catch (error) {
      //Ошибка в синтаксе формулы
      return () => formatterString;
    }
  }
}
