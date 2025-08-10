"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { Controller, FormProvider, useFormContext, } from "react-hook-form"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

const Form = FormProvider

const FormField = ({ ...props }) => {
  return (
    <Controller
      {...props}
      render={({ field, fieldState: { error } }) => {
        return (
          <FormFieldProvider value={{ ...field, invalid: !!error, isDirty: !!field.value }}>
            {props.render({ field, fieldState: { error } })}
          </FormFieldProvider>
        );
      }}
    />
  );
};

const FormFieldProvider = React.createContext(null);

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldProvider);
  const { formState } = useFormContext();

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>");
  }

  return { ...fieldContext, formState };
};

const FormItem = React.forwardRef(({
  className,
  ...props
}, ref) => {
  const { invalid } = useFormField();
  return (
    <div
      ref={ref}
      className={cn("space-y-2", className)}
      data-invalid={invalid ? "true" : undefined}
      {...props}
    />
  );
});
FormItem.displayName = "FormItem";

const FormLabel = React.forwardRef(({
  className,
  ...props
}, ref) => {
  const { name, invalid } = useFormField();
  return (
    <Label
      ref={ref}
      className={cn(invalid && "text-destructive", className)}
      htmlFor={name}
      {...props}
    />
  );
});
FormLabel.displayName = "FormLabel";

const FormControl = React.forwardRef(({
  ...props
}, ref) => {
  const { invalid, name, onChange, onBlur, value, disabled } = useFormField();
  return (
    <Slot
      ref={ref}
      id={name}
      aria-invalid={invalid}
      aria-describedby={invalid ? `${name}-error` : undefined}
      onChange={onChange}
      onBlur={onBlur}
      value={value}
      disabled={disabled}
      {...props}
    />
  );
});
FormControl.displayName = "FormControl";

const FormDescription = React.forwardRef(({
  className,
  ...props
}, ref) => {
  const { name } = useFormField();
  return (
    <p
      ref={ref}
      id={`${name}-description`}
      className={cn("text-[0.8rem] text-muted-foreground", className)}
      {...props}
    />
  );
});
FormDescription.displayName = "FormDescription";

const FormMessage = React.forwardRef(({
  className,
  children,
  ...props
}, ref) => {
  const { invalid, name, formState: { errors } } = useFormField();
  const body = errors[name]?.message;

  if (!body) {
    return null;
  }

  return (
    <p
      ref={ref}
      id={`${name}-error`}
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  );
});
FormMessage.displayName = "FormMessage";

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
};