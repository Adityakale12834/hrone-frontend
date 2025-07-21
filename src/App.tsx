import "./App.css";
import { JsonSchemaBuilder } from "@/components/json-schema-builder";

function App() {
  return (
    <>
      <main className="container mx-auto py-8 max-w-5xl">
        <h1 className="text-2xl font-bold mb-6">JSON Schema Builder</h1>
        <JsonSchemaBuilder />
      </main>
    </>
  );
}

export default App;
