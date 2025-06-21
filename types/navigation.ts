import { Strain } from '@/types';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Dashboard: undefined;
  LabChat: undefined;
  GlobalChat: undefined;
  StrainLibrary: { selectedStrain?: Strain };
  Settings: undefined;
  Paywall: { feature: string };
  AdminPanel: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
