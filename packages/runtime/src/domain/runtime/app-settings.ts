export interface AppSettings {
  service: {
    // log?:{
    //   verbose: boolean;
    // },
    ai?: {
      endpoint: string;
      token: string;
    };
    fs? : {},
    fetch? : {},
    kv?:{}
  };
}
// export interface AppSettings {
//   host: HostSettings;
//   app: AppSettings;
// }
