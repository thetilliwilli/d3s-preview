import "winbox/dist/css/winbox.min.css";
import "./App.css";
import { BindingEditor } from "./component/binding-editor/binding-editor";
import { NetworkViewer } from "./component/network-viewer";
import { PropertyEditor } from "./component/property-grid/property-editor";
import { ResourceImporter } from "./component/resource-importer/resource-importer";
import { RepositoryWindow } from "./component/property-grid/repository-window";
import { EditViewWindow } from "./component/edit-view-window";
import { AiWindow } from "./component/property-grid/ai-window";

function App() {
  return (
    <>
      <NetworkViewer />
      <PropertyEditor />
      <ResourceImporter />
      <BindingEditor />
      <RepositoryWindow />
      <AiWindow />
      <EditViewWindow />
    </>
  );
}

export default App;
