import { useState } from "react"

export default function EventForm() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    location: "",
    category: "Música",

    image_url: "",
    image_emoji: "🎫",
    image_bg: "#f3f4f6",

    total_capacity: "",

    ticket_types: [
      { name: "General", price: 0, quantity: 0 }
    ]
  })

  const handleChange = (e) => {
    const { name, value, type } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value
    }))
  }

  const handleTicketChange = (index, field, value) => {
    const updatedTickets = [...formData.ticket_types]

    updatedTickets[index][field] =
      field === "price" || field === "quantity"
        ? Number(value)
        : value

    setFormData((prev) => ({
      ...prev,
      ticket_types: updatedTickets
    }))
  }

  const addTicketType = () => {
    setFormData((prev) => ({
      ...prev,
      ticket_types: [
        ...prev.ticket_types,
        { name: "", price: 0, quantity: 0 }
      ]
    }))
  }

  const removeTicketType = (index) => {
    const updated = formData.ticket_types.filter((_, i) => i !== index)

    setFormData((prev) => ({
      ...prev,
      ticket_types: updated
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log("DATA:", formData)

    // acá después podés meter axios
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">

      <input
        name="title"
        placeholder="Título"
        value={formData.title}
        onChange={handleChange}
        className="w-full border p-2 rounded"
      />

      <textarea
        name="description"
        placeholder="Descripción"
        value={formData.description}
        onChange={handleChange}
        className="w-full border p-2 rounded"
      />

      <input
        type="datetime-local"
        name="date"
        value={formData.date}
        onChange={handleChange}
        className="w-full border p-2 rounded"
      />

      <input
        name="location"
        placeholder="Ubicación"
        value={formData.location}
        onChange={handleChange}
        className="w-full border p-2 rounded"
      />

      <select
        name="category"
        value={formData.category}
        onChange={handleChange}
        className="w-full border p-2 rounded"
      >
        <option>Música</option>
        <option>Teatro</option>
        <option>Danza</option>
        <option>Arte</option>
        <option>Privado</option>
      </select>

      <div className="grid grid-cols-3 gap-2">
        <input
          name="image_url"
          placeholder="URL imagen"
          value={formData.image_url}
          onChange={handleChange}
          className="border p-2 rounded"
        />

        <input
          name="image_emoji"
          placeholder="Emoji"
          value={formData.image_emoji}
          onChange={handleChange}
          className="border p-2 rounded"
        />

        <input
          type="color"
          name="image_bg"
          value={formData.image_bg}
          onChange={handleChange}
          className="border p-1 rounded h-10"
        />
      </div>

      <input
        type="number"
        name="total_capacity"
        placeholder="Capacidad total"
        value={formData.total_capacity}
        onChange={handleChange}
        className="w-full border p-2 rounded"
      />

      {/* 🎟️ Ticket Types */}
      <div className="space-y-2">
        <h3 className="font-bold">Tipos de entrada</h3>

        {formData.ticket_types.map((ticket, index) => (
          <div key={index} className="grid grid-cols-3 gap-2 items-center">

            <input
              placeholder="Nombre"
              value={ticket.name}
              onChange={(e) =>
                handleTicketChange(index, "name", e.target.value)
              }
              className="border p-2 rounded"
            />

            <input
              type="number"
              placeholder="Precio"
              value={ticket.price}
              onChange={(e) =>
                handleTicketChange(index, "price", e.target.value)
              }
              className="border p-2 rounded"
            />

            <input
              type="number"
              placeholder="Cantidad"
              value={ticket.quantity}
              onChange={(e) =>
                handleTicketChange(index, "quantity", e.target.value)
              }
              className="border p-2 rounded"
            />

            <button
              type="button"
              onClick={() => removeTicketType(index)}
              className="col-span-3 text-red-500 text-sm"
            >
              Eliminar
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addTicketType}
          className="bg-gray-200 px-3 py-1 rounded"
        >
          + Agregar tipo
        </button>
      </div>

      <button className="bg-black text-white px-4 py-2 rounded">
        Guardar
      </button>
    </form>
  )
}