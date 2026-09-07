"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import { HostedZoneCreate } from "@/types/api";

interface CreateZoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: HostedZoneCreate) => Promise<void>;
}

export default function CreateZoneModal({ isOpen, onClose, onSubmit }: CreateZoneModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"Public" | "Private">("Public");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({ name, type, comment: comment || null });
      setName("");
      setType("Public");
      setComment("");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setName("");
    setType("Public");
    setComment("");
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create hosted zone"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading} disabled={!name}>
            Create hosted zone
          </Button>
        </>
      }
    >
      <form id="create-zone-form" onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Domain name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="example.com"
          hint="The name of the domain. For example, example.com."
          required
          autoFocus
        />

        <Select
          label="Type"
          value={type}
          onChange={(e) => setType(e.target.value as "Public" | "Private")}
          options={[
            { value: "Public", label: "Public hosted zone" },
            { value: "Private", label: "Private hosted zone" },
          ]}
          hint="Public zones route traffic on the internet. Private zones route traffic within VPCs."
        />

        <Textarea
          label="Comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Optional description"
          rows={3}
        />
      </form>
    </Modal>
  );
}
