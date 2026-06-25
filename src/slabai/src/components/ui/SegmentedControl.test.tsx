import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { SegmentedControl } from "./SegmentedControl";

describe("SegmentedControl", () => {
  it("emits selected value", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SegmentedControl
        label="Mode"
        onChange={onChange}
        options={[
          { label: "Race", value: "race" },
          { label: "Fitness", value: "fitness" }
        ]}
        value="race"
      />
    );
    await user.click(screen.getByRole("radio", { name: "Fitness" }));
    expect(onChange).toHaveBeenCalledWith("fitness");
  });
});
