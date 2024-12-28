type FlatObjectEntry = ([propPath: string, propValue: any]);
type FlatObjectEntryWithPaths = [propValue: any, ...propPaths: string[]];

function listLeafs(object: any, result: FlatObjectEntryWithPaths[] = [], paths: string[] = []) {
    Object.entries(object).map(([key, value]) => {
        const cursor = paths.concat(key);
        const typeofValue = typeof value;
        if (typeofValue === "number" || typeofValue === "bigint" || typeofValue === "boolean" || typeofValue === "string" || typeofValue === "undefined" || value === null)
            result.push([value].concat(cursor) as FlatObjectEntryWithPaths);
        else
            listLeafs(value, result, cursor);
    });
}

export class FlatObject {

    private flatObject: FlatObjectEntry[];

    constructor(obj: any) {
        const flatObject: FlatObjectEntryWithPaths[] = [];
        listLeafs(obj, flatObject);
        this.flatObject = flatObject
            .map(x => [x.slice(1).join("."), x[0]] as FlatObjectEntry)
            .sort((fst, sec) => fst[0].length - sec[0].length || fst[0].localeCompare(sec[0]));
    }

    hash() {
        return this.flatObject.map(x => x[0]).join("\n")
    }

    isEqual(other: FlatObject) {
        return other.hash() === this.hash();
    }

    keys() {
        return this.flatObject.map(x => x[0]);
    }

    values() {
        return this.flatObject.map(x => x[1]);
    }

    entries(): FlatObjectEntry[] {
        return this.flatObject;
    }

    hasKey(key: string) {
        return this.flatObject.some(x => x[0] === key);
    }

    diff(other: FlatObject) {
        const keys = [... new Set(this.keys().concat(other.keys()))];
        return keys.filter(key => +this.hasKey(key) ^ +other.hasKey(key));
    }
}