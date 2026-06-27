import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
  it("prevents clicks while loading", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick} type="button">
        Save
      </Button>
    );
    await user.click(screen.getByRole("button", { name: /đang xử lý/i }));
    expect(onClick).not.toHaveBeenCalled();
  });
});
