<script>
export default {
  name: "MixinRules",

  data: () => ({
    // Input max values
    valueMaxSmall: 100,
    valueMaxBig: 65535,

    // Rules
    rules: {
      required: (value) => !!value || "Required",
      max50: (value) =>
        (value !== null && value !== undefined && value.length <= 100) ||
        "Max 100 characters",
      ascii: (value) =>
        (value !== null &&
          value !== undefined &&
          value
            .split("")
            .every((v) => v.charCodeAt(0) >= 32 && v.charCodeAt(0) <= 255)) ||
        "Contains invalid character",
      nameMatch(name) {
        return (value) => value === name || "The names do not match !";
      },
      passwordMatch(name) {
        return (value) => value === name || "The passwords do not match !";
      },
    },
  }),
};
</script>
