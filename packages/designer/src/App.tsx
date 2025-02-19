import "winbox/dist/css/winbox.min.css";
import "./App.css";
import { BindingEditor } from "./component/binding-editor/binding-editor";
import { NetworkViewer } from "./component/network-viewer";
import { PropertyEditor } from "./component/property-grid/property-editor";
import { EditViewWindow } from "./component/edit-view-window";
import { OmniboxComponent } from "./component/omnibox/omnibox-component";
import { RepositoryWindow } from "./component/property-grid/repository-window";

function App() {
  return (
    <>
      <NetworkViewer />
      <PropertyEditor />
      <BindingEditor />
      <RepositoryWindow />
      <EditViewWindow />
      <OmniboxComponent />
    </>
  );
}

export default App;
