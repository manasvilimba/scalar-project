"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import { DnsRecordCreate, DnsRecordUpdate, DnsRecordResponse, DNS_RECORD_TYPES, ROUTING_POLICIES, DnsRecordType, RoutingPolicy } from "@/types/api";

interface CreateEditRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DnsRecordCreate | DnsRecordUpdate) => Promise<void>;
  initialData?: DnsRecordResponse;
  zoneName: string;
}

export default function CreateEditRecordModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  zoneName,
}: CreateEditRecordModalProps) {
  const isEdit = !!initialData;

  const [name, setName] = useState("");
  const [type, setType] = useState(DNS_RECORD_TYPES[0]);
  const [value, setValue] = useState("");
  const [ttl, setTtl] = useState(300);
  const [routingPolicy, setRoutingPolicy] = useState(ROUTING_POLICIES[0]);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (initialData) {
          const n = initialData.name;
          // strip zone name to make it easier to edit, or leave it. We'll show the full name to users.
          setName(n);
          setType(initialData.type);
          setValue(initialData.value);
          setTtl(initialData.ttl);
          setRoutingPolicy(initialData.routing_policy);
          setComment(initialData.comment || "");
        } else {
          setName("");
          setType(DNS_RECORD_TYPES[0]);
          setValue("");
          setTtl(300);
          setRoutingPolicy(ROUTING_POLICIES[0]);
          setComment("");
        }
      }, 0);
    }
  }, [isOpen, initialData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await onSubmit({
          value,
          ttl: Number(ttl),
          routing_policy: routingPolicy,
          comment: comment || null,
        } as DnsRecordUpdate);
      } else {
        // If the user didn't enter anything, we just use the zone apex
        // Otherwise append zoneName if they didn't already end it with a dot
        const finalName = name.trim() || zoneName;
        await onSubmit({
          name: finalName,
          type,
          value,
          ttl: Number(ttl),
          routing_policy: routingPolicy,
          comment: comment || null,
        } as DnsRecordCreate);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit record" : "Create record"}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading} disabled={!value}>
            {isEdit ? "Save changes" : "Create record"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Record name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={`e.g. www.${zoneName}`}
            hint={isEdit ? "Name cannot be changed after creation." : `Leave blank to create a record for the zone apex (${zoneName}).`}
            disabled={isEdit || loading}
            autoFocus={!isEdit}
          />

          <Select
            label="Record type"
            value={type}
            onChange={(e) => setType(e.target.value as DnsRecordType)}
            options={DNS_RECORD_TYPES.map((t) => ({ value: t, label: t }))}
            disabled={isEdit || loading}
            hint={isEdit ? "Type cannot be changed after creation." : ""}
          />
        </div>

        <Textarea
          label="Value"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Enter record value. For multiple values, use JSON format."
          required
          rows={3}
          disabled={loading}
          autoFocus={isEdit}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="TTL (Seconds)"
            type="number"
            min={0}
            value={ttl}
            onChange={(e) => setTtl(Number(e.target.value))}
            required
            disabled={loading}
          />

          <Select
            label="Routing policy"
            value={routingPolicy}
            onChange={(e) => setRoutingPolicy(e.target.value as RoutingPolicy)}
            options={ROUTING_POLICIES.map((p) => ({ value: p, label: p }))}
            disabled={loading}
          />
        </div>

        <Input
          label="Comment (Optional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="A description of this record"
          disabled={loading}
        />
      </form>
    </Modal>
  );
}
