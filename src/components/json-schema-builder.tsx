// src/components/json-schema-builder.tsx
import {
  useForm,
  useFieldArray,
  FormProvider,
  useFormContext,
  Controller,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Plus, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

type SchemaFieldType = "string" | "number" | "nested";

interface SchemaField {
  id: string;
  name: string;
  type: SchemaFieldType;
  fields?: SchemaField[];
}

const schemaFormValidator = z.object({
  fields: z.array(
    z.object({
      id: z.string(),
      name: z.string().min(1, "Name is required"),
      type: z.enum(["string", "number", "nested"]),
      fields: z.lazy(() => schemaFormValidator.shape.fields).optional(),
    })
  ),
});

type SchemaFormValues = z.infer<typeof schemaFormValidator>;

export function JsonSchemaBuilder() {
  const form = useForm<SchemaFormValues>({
    resolver: zodResolver(schemaFormValidator),
    defaultValues: {
      fields: [
        {
          id: crypto.randomUUID(),
          name: "",
          type: "string",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "fields",
  });

  const addField = (parentPath?: string) => {
    const newField = {
      id: crypto.randomUUID(),
      name: "",
      type: "string" as SchemaFieldType,
    };

    if (parentPath) {
      const currentFields = form.getValues(`${parentPath}.fields`) || [];
      form.setValue(`${parentPath}.fields`, [...currentFields, newField]);
    } else {
      append(newField);
    }
  };

  const removeField = (path: string) => {
    if (path.includes(".fields.")) {
      const parts = path.split(".");
      const index = parseInt(parts[parts.length - 1]);
      const parentPath = parts.slice(0, -1).join(".");
      const currentFields = form.getValues(parentPath) || [];
      const updatedFields = [...currentFields];
      updatedFields.splice(index, 1);
      form.setValue(parentPath, updatedFields);
    } else {
      remove(parseInt(path));
    }
  };

  const generateSchema = (fields: SchemaField[]): any => {
    return fields.reduce((acc, field) => {
      let fieldValue: any;

      switch (field.type) {
        case "string":
          fieldValue = "string";
          break;
        case "number":
          fieldValue = "number";
          break;
        case "nested":
          fieldValue = field.fields ? generateSchema(field.fields) : {};
          break;
        default:
          fieldValue = "";
      }

      return {
        ...acc,
        [field.name]: fieldValue,
      };
    }, {});
  };

  const schema = generateSchema(form.watch("fields"));

  return (
    <FormProvider {...form}>
      <div className="space-y-4 max-w-5xl mx-auto">
        <Tabs defaultValue="builder" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="builder">Schema Builder</TabsTrigger>
            <TabsTrigger value="preview">JSON Preview</TabsTrigger>
          </TabsList>
          <TabsContent value="builder">
            <div className="space-y-4">
              {fields.map((field, index) => (
                <FieldRow
                  key={field.id}
                  field={field}
                  path={`fields.${index}`}
                  onAddField={addField}
                  onRemoveField={removeField}
                />
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => addField()}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Field
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="preview">
            <pre className="rounded-md bg-muted p-4 overflow-auto">
              {JSON.stringify(schema, null, 2)}
            </pre>
          </TabsContent>
        </Tabs>
      </div>
    </FormProvider>
  );
}

interface FieldRowProps {
  field: any;
  path: string;
  onAddField: (parentPath?: string) => void;
  onRemoveField: (path: string) => void;
}

function FieldRow({ field, path, onAddField, onRemoveField }: FieldRowProps) {
  const { register, watch, control } = useFormContext();
  const type = watch(`${path}.type`);
  const nestedFields = watch(`${path}.fields`);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Field name"
          {...register(`${path}.name`, { required: true })}
        />

        <Controller
          name={`${path}.type`}
          control={control}
          render={({ field: { onChange, value } }) => (
            <Select value={value} onValueChange={onChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="string">String</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="nested">Nested</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        <Button
          type="button"
          variant="destructive"
          size="icon"
          onClick={() => onRemoveField(path)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {type === "nested" && (
        <div className="space-y-2 pl-6">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-muted-foreground">
              Nested Fields
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onAddField(path)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Nested Field
            </Button>
          </div>
          <div className="space-y-2">
            {nestedFields?.map((nestedField: any, nestedIndex: number) => (
              <FieldRow
                key={nestedField.id}
                field={nestedField}
                path={`${path}.fields.${nestedIndex}`}
                onAddField={onAddField}
                onRemoveField={onRemoveField}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
