'use client'

import { FormEvent, useEffect, useState } from 'react'

const manualCategories = ['Electronics', 'Home & Living', 'Fashion', 'Beauty & Personal Care', 'Health & Wellness', 'Baby & Kids', 'Sports & Outdoors', 'Automotive', 'Tools & Hardware', 'Office & Business', 'Food & Beverage', 'Other']

function normalizedManualCategory(value: string) {
  if (value === 'Home & living') return 'Home & Living'
  if (value === 'Beauty & care') return 'Beauty & Personal Care'
  return manualCategories.includes(value) ? value : 'Other'
}

type Opportunity = {
  id: string
  title: string
  demand_summary?: string
  source_url?: string
  proposed_supplier?: { business_name?: string }
  proposed_product?: { name?: string; image_url?: string | null; retail_price_cents?: number | null; supplier_cost_cents?: number | null; markup_percent?: number | null }
}

type AttentionEvent = {
  id: string
  task_id?: string
  event_type: 'automation_failed' | 'paid_order_requires_dispatch'
  created_at: string
  payload?: { message?: string; order_id?: string }
}

type DashboardData = {
  opportunities: Opportunity[]
  attentionEvents: AttentionEvent[]
  orders: FulfilmentOrder[]
  products?: Array<{ id: string; name: string; category?: string; image_url?: string; supplier_cost_cents?: number; retail_price_cents?: number; stock_quantity?: number; lifecycle_status?: string; updated_at?: string; supplier?: { id?: string; source_url?: string; website_url?: string } | Array<{ id?: string; source_url?: string; website_url?: string }> }>
  metrics: { suppliers: number; activePromotions: number; successfulPayments: number; queuedTasks: number }
}

type ListingDraft = { price: string; imageUrl: string }
type FulfilmentDelivery = { id: string; supplier_id: string; status: string; internal_reference?: string | null; supplier_reference?: string | null; tracking_number?: string | null; carrier?: string | null; procurement_cost_cents?: number | null; supplier_cost_cents?: number | null; procurement_url?: string | null }
type FulfilmentItem = { supplier_id: string; product_name: string; unit_price_cents: number; quantity: number; products?: { supplier_cost_cents?: number | null; suppliers?: { business_name?: string; source_url?: string; website_url?: string } | Array<{ business_name?: string; source_url?: string; website_url?: string }> } }
type FulfilmentOrder = { id: string; status: string; total_cents: number; delivery_fee_cents?: number | null; customer_email?: string; delivery_address?: { line1?: string; suburb?: string; city?: string; postalCode?: string; mapUrl?: string }; delivery_phone?: string; delivery_status?: string; delivery_provider?: string; delivery_quote_cents?: number | null; items: FulfilmentItem[]; deliveries: FulfilmentDelivery[] }
type FulfilmentDraft = { supplierReference: string; procurementUrl: string; procurementCost: string; notes: string; trackingNumber: string; carrier: string }
type ProductMediaDraft = { imageUrl: string; supplierProductUrl: string; imageFile?: File }
type ManagedProduct = NonNullable<DashboardData['products']>[number]

function ProductManagement({ products, onChanged }: { products: ManagedProduct[]; onChanged: () => Promise<void> }) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All categories')
  const [status, setStatus] = useState('All statuses')
  const [message, setMessage] = useState('')
  const visible = products.filter(product => product.name.toLowerCase().includes(search.toLowerCase()) && (category === 'All categories' || normalizedManualCategory(product.category || '') === category) && (status === 'All statuses' || product.lifecycle_status === status))
  async function saveLifecycleStatus(product: ManagedProduct, lifecycleStatus: string) {
    if (lifecycleStatus === 'archived' && !window.confirm(`Remove ${product.name} from the shop? It will stay safely archived and can be restored later.`)) return
    const response = await fetch('/api/dashboard', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update-product', productId: product.id, supplierCostCents: product.supplier_cost_cents, lifecycleStatus }) })
    setMessage(response.ok ? `Updated ${product.name}.` : 'Could not update product status.')
    await onChanged()
  }
  return <section className="mt-8 rounded-xl border bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">Product management</h2><p className="mt-1 text-sm text-slate-600">Removing a product archives it safely; it can be restored later.</p><div className="mt-4 grid gap-3 md:grid-cols-3"><input value={search} onChange={event => setSearch(event.target.value)} className="rounded border p-3" placeholder="Search products" /><select value={category} onChange={event => setCategory(event.target.value)} className="rounded border p-3"><option>All categories</option>{manualCategories.map(item => <option key={item}>{item}</option>)}</select><select value={status} onChange={event => setStatus(event.target.value)} className="rounded border p-3"><option>All statuses</option>{['active', 'paused', 'out_of_stock', 'archived'].map(item => <option key={item} value={item}>{item.replace('_', ' ')}</option>)}</select></div><div className="mt-5 grid gap-4">{visible.map(product => { const hasCost = typeof product.supplier_cost_cents === 'number'; const cost = product.supplier_cost_cents || 0; const price = product.retail_price_cents || Math.round(cost * 1.25); const profit = price - cost; const isArchived = product.lifecycle_status === 'archived'; return <article className="rounded-lg border p-4" key={product.id}><div className="flex gap-4">{product.image_url && <img src={product.image_url} alt="" className="h-20 w-20 rounded object-cover" />}<div className="flex-1"><h3 className="font-semibold">{product.name}</h3><p className="text-sm text-slate-600">{normalizedManualCategory(product.category || '')} · {product.lifecycle_status || 'active'}</p><p className="mt-2 text-sm">{hasCost ? <>Cost: R{(cost / 100).toFixed(2)} · Price: R{(price / 100).toFixed(2)} · Profit: R{(profit / 100).toFixed(2)}</> : 'Supplier cost not recorded'}</p><p className="text-xs text-slate-500">Updated: {product.updated_at ? new Date(product.updated_at).toLocaleString() : 'Not recorded'}</p><div className="mt-3 flex flex-wrap gap-2">{isArchived ? <button onClick={() => saveLifecycleStatus(product, 'paused')} className="rounded border px-3 py-1 text-xs">Restore as paused</button> : <>{['active', 'paused', 'out_of_stock'].map(item => <button onClick={() => saveLifecycleStatus(product, item)} className="rounded border px-3 py-1 text-xs" key={item}>{item.replace('_', ' ')}</button>)}<button onClick={() => saveLifecycleStatus(product, 'archived')} className="rounded border border-red-500 px-3 py-1 text-xs text-red-700">Remove</button></>}</div></div></div></article> })}{visible.length === 0 && <p className="text-slate-600">No products match these filters.</p>}</div>{message && <p className="mt-4 text-sm">{message}</p>}</section>
}

function ProductMediaEditor({ products, onChanged }: { products: ManagedProduct[]; onChanged: () => Promise<void> }) {
  const [drafts, setDrafts] = useState<Record<string, ProductMediaDraft>>({})
  const [message, setMessage] = useState('')
  const details = (product: ManagedProduct): ProductMediaDraft => {
    const supplier = Array.isArray(product.supplier) ? product.supplier[0] : product.supplier
    return drafts[product.id] || { imageUrl: product.image_url || '', supplierProductUrl: supplier?.source_url || supplier?.website_url || '' }
  }
  function update(product: ManagedProduct, changes: Partial<ProductMediaDraft>) {
    setDrafts(current => ({ ...current, [product.id]: { ...details(product), ...current[product.id], ...changes } }))
  }
  async function save(product: ManagedProduct) {
    const draft = details(product)
    let imageUrl = draft.imageUrl.trim()
    if (draft.imageFile) {
      const form = new FormData()
      form.append('image', draft.imageFile)
      const upload = await fetch('/api/dashboard/upload', { method: 'POST', body: form })
      const uploaded = await upload.json().catch(() => ({})) as { imageUrl?: string; error?: string }
      if (!upload.ok || !uploaded.imageUrl) { setMessage(uploaded.error || 'Image upload failed.'); return }
      imageUrl = uploaded.imageUrl
    }
    const supplier = Array.isArray(product.supplier) ? product.supplier[0] : product.supplier
    const response = await fetch('/api/dashboard', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update-product', productId: product.id, supplierId: supplier?.id, supplierCostCents: product.supplier_cost_cents, lifecycleStatus: product.lifecycle_status || 'paused', imageUrl, supplierProductUrl: draft.supplierProductUrl }) })
    const result = await response.json().catch(() => ({})) as { error?: string }
    setMessage(response.ok ? `Updated ${product.name}.` : result.error || 'Could not save product details.')
    if (response.ok) setDrafts(current => { const next = { ...current }; delete next[product.id]; return next })
    await onChanged()
  }
  return <section className="mt-8 rounded-xl border bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">Edit product image and supplier link</h2><p className="mt-2 text-sm text-slate-600">The public image and private supplier purchase link are separate. Changing an image never removes the fulfilment link.</p><div className="mt-4 grid gap-4">{products.map(product => { const draft = details(product); return <article className="rounded-lg border p-4" key={product.id}><h3 className="font-semibold">{product.name}</h3><div className="mt-3 grid gap-3 md:grid-cols-2"><label className="text-sm font-medium">Public image URL<input type="url" value={draft.imageUrl} onChange={event => update(product, { imageUrl: event.target.value })} className="mt-1 block w-full rounded border p-2" placeholder="https://...image.jpg" /></label><label className="text-sm font-medium">Upload replacement image<input type="file" accept="image/*" onChange={event => update(product, { imageFile: event.target.files?.[0] })} className="mt-1 block w-full rounded border p-2" /></label><label className="text-sm font-medium md:col-span-2">Private supplier product URL<input type="url" value={draft.supplierProductUrl} onChange={event => update(product, { supplierProductUrl: event.target.value })} className="mt-1 block w-full rounded border p-2" placeholder="https://supplier.co.za/product/..." /></label></div><button onClick={() => save(product)} className="mt-3 rounded border border-navy px-3 py-2 text-sm font-semibold text-navy">Save image and supplier link</button></article> })}</div>{message && <p className="mt-4 text-sm" role="status">{message}</p>}</section>
}

function ProductCleanup({ products, onChanged }: { products: ManagedProduct[]; onChanged: () => Promise<void> }) {
  const [costs, setCosts] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')
  const missingCost = products.filter(product => !product.supplier_cost_cents || product.supplier_cost_cents <= 0)
  const archived = products.filter(product => product.lifecycle_status === 'archived')

  async function request(payload: Record<string, unknown>) {
    const response = await fetch('/api/dashboard', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    return { response, result: await response.json().catch(() => ({})) as { error?: string } }
  }

  async function archiveMissingCosts() {
    if (!window.confirm(`Archive ${missingCost.length} product(s) without supplier costs? They can be restored later after a cost is added.`)) return
    const { response, result } = await request({ action: 'archive-products-without-cost' })
    setMessage(response.ok ? 'Products without supplier costs were archived.' : result.error || 'Could not archive the products.')
    await onChanged()
  }

  async function saveCost(product: ManagedProduct) {
    const supplierCostCents = Math.round(Number(costs[product.id]) * 100)
    if (!Number.isInteger(supplierCostCents) || supplierCostCents <= 0) { setMessage('Enter a supplier cost above zero.'); return }
    const { response, result } = await request({ action: 'update-product', productId: product.id, supplierCostCents, lifecycleStatus: product.lifecycle_status || 'paused' })
    setMessage(response.ok ? `Saved cost for ${product.name}. The customer price now includes the 25% markup.` : result.error || 'Could not save supplier cost.')
    await onChanged()
  }

  async function permanentlyDelete(product: ManagedProduct) {
    if (!window.confirm(`Permanently delete ${product.name}? This cannot be undone. Products with order history will remain archived.`)) return
    const { response, result } = await request({ action: 'permanently-delete-product', productId: product.id })
    setMessage(response.ok ? `${product.name} was permanently deleted.` : result.error || 'This product could not be permanently deleted.')
    await onChanged()
  }

  return <section className="mt-8 rounded-xl border bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">Product cleanup</h2><p className="mt-2 text-sm text-slate-600">Every product needs a supplier cost. Adding one automatically recalculates its customer price using the 25% markup.</p>{missingCost.length > 0 && <><button onClick={archiveMissingCosts} className="mt-4 rounded-lg border border-amber-700 px-4 py-2 text-sm font-semibold text-amber-900">Archive all products without supplier cost</button><div className="mt-4 grid gap-3">{missingCost.map(product => <div className="flex flex-wrap items-center gap-3 rounded-lg border p-3" key={product.id}><span className="min-w-56 flex-1 font-medium">{product.name}</span><input type="number" min="0.01" step="0.01" value={costs[product.id] || ''} onChange={event => setCosts(current => ({ ...current, [product.id]: event.target.value }))} className="rounded border p-2" placeholder="Supplier cost (R)" /><button onClick={() => saveCost(product)} className="rounded border border-navy px-3 py-2 text-sm font-semibold text-navy">Save cost</button></div>)}</div></>}{missingCost.length === 0 && <p className="mt-4 text-sm text-green-700">All products have supplier costs.</p>}<h3 className="mt-7 font-semibold">Archived products</h3><p className="mt-1 text-sm text-slate-600">Products with no order history can be permanently deleted.</p><div className="mt-3 grid gap-3">{archived.map(product => <div className="flex flex-wrap items-center gap-3 rounded-lg border p-3" key={product.id}><span className="min-w-56 flex-1 font-medium">{product.name}</span><button onClick={() => permanentlyDelete(product)} className="rounded border border-red-700 px-3 py-2 text-sm font-semibold text-red-800">Permanently delete</button></div>)}{archived.length === 0 && <p className="text-sm text-slate-600">No archived products.</p>}</div>{message && <p className="mt-4 text-sm" role="status">{message}</p>}</section>
}

function SupplierPurchaseLinks({ products }: { products: ManagedProduct[] }) {
  const linkedProducts = products.map(product => ({ product, supplier: Array.isArray(product.supplier) ? product.supplier[0] : product.supplier })).filter(({ supplier }) => supplier?.source_url || supplier?.website_url)
  return <section className="mt-8 rounded-xl border bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">Supplier purchase links</h2><p className="mt-2 text-sm text-slate-600">Open the supplier product page when you need to purchase an item for fulfilment.</p><div className="mt-4 grid gap-3">{linkedProducts.map(({ product, supplier }) => <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3" key={product.id}><span className="font-medium">{product.name}</span><a href={supplier?.source_url || supplier?.website_url} target="_blank" rel="noreferrer" className="rounded border border-navy px-3 py-2 text-sm font-semibold text-navy">Open supplier product</a></div>)}{linkedProducts.length === 0 && <p className="text-sm text-slate-600">No supplier product links are recorded yet.</p>}</div></section>
}

function OpportunityCleanup({ opportunities, onChanged }: { opportunities: Opportunity[]; onChanged: () => Promise<void> }) {
  const [message, setMessage] = useState('')
  async function discard(opportunity: Opportunity) {
    if (!window.confirm(`Discard ${opportunity.title}? It will be removed from review and cannot be approved later.`)) return
    const response = await fetch('/api/dashboard', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'discard-opportunity', opportunityId: opportunity.id }) })
    const result = await response.json().catch(() => ({})) as { error?: string }
    setMessage(response.ok ? 'Opportunity discarded.' : result.error || 'Could not discard opportunity.')
    await onChanged()
  }
  return <section className="mt-8 rounded-xl border bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">Discard research opportunity</h2><p className="mt-2 text-sm text-slate-600">Use this when a result has no valid supplier image, price, or purchase link.</p><div className="mt-4 grid gap-3">{opportunities.map(opportunity => <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3" key={opportunity.id}><span className="font-medium">{opportunity.title}</span><button onClick={() => discard(opportunity)} className="rounded border border-red-500 px-3 py-2 text-sm font-semibold text-red-700">Discard opportunity</button></div>)}{opportunities.length === 0 && <p className="text-sm text-slate-600">No opportunities are waiting for review.</p>}</div>{message && <p className="mt-4 text-sm" role="status">{message}</p>}</section>
}

function FulfilmentCompletion({ orders, onChanged }: { orders: FulfilmentOrder[]; onChanged: () => Promise<void> }) {
  const [quotes, setQuotes] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')

  async function request(payload: Record<string, unknown>) {
    const response = await fetch('/api/dashboard', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    return { response, result: await response.json().catch(() => ({})) as { error?: string; message?: string } }
  }

  async function saveQuote(order: FulfilmentOrder) {
    const deliveryQuoteCents = Math.round(Number(quotes[order.id]) * 100)
    if (!Number.isInteger(deliveryQuoteCents) || deliveryQuoteCents < 0) { setMessage('Enter a valid delivery amount.'); return }
    const { response, result } = await request({ action: 'set-manual-delivery-quote', orderId: order.id, deliveryQuoteCents })
    setMessage(response.ok ? result.message || 'Delivery amount saved.' : result.error || 'Could not save delivery amount.')
    await onChanged()
  }

  async function markDelivered(order: FulfilmentOrder) {
    if (!window.confirm(`Mark order ${order.id.slice(0, 8)} as delivered? It will be removed from the fulfilment queue.`)) return
    const { response, result } = await request({ action: 'mark-order-delivered', orderId: order.id })
    setMessage(response.ok ? result.message || 'Order marked as delivered.' : result.error || 'Could not complete this order.')
    await onChanged()
  }

  return <section className="mt-8 rounded-xl border bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">Delivery completion</h2><p className="mt-2 text-sm text-slate-600">Enter a manual supplier or courier quote when needed. Mark an order delivered only after the customer has received it.</p><div className="mt-4 grid gap-3">{orders.map(order => <div className="flex flex-wrap items-center gap-3 rounded-lg border p-4" key={order.id}><div className="min-w-52 flex-1"><p className="font-semibold">Order {order.id.slice(0, 8)}</p><p className="text-sm text-slate-600">Current delivery: {typeof order.delivery_quote_cents === 'number' ? `R${(order.delivery_quote_cents / 100).toFixed(2)}` : 'Not quoted'}</p></div><input type="number" min="0" step="0.01" value={quotes[order.id] || ''} onChange={event => setQuotes(current => ({ ...current, [order.id]: event.target.value }))} className="rounded border p-2" placeholder="Delivery amount (R)" /><button onClick={() => saveQuote(order)} className="rounded border border-navy px-3 py-2 text-sm font-semibold text-navy">Save quote</button><button onClick={() => markDelivered(order)} className="rounded bg-green px-3 py-2 text-sm font-semibold text-white">Mark delivered</button></div>)}{orders.length === 0 && <p className="text-sm text-slate-600">No orders are waiting for completion.</p>}</div>{message && <p className="mt-4 text-sm" role="status">{message}</p>}</section>
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [message, setMessage] = useState('')
  const [demandSignal, setDemandSignal] = useState('')
  const [listingDrafts, setListingDrafts] = useState<Record<string, ListingDraft>>({})
  const [fulfilmentDrafts, setFulfilmentDrafts] = useState<Record<string, FulfilmentDraft>>({})
  const [manualProduct, setManualProduct] = useState({ name: '', description: '', category: '', supplierName: '', supplierContact: '', supplierPhone: '', supplierUrl: '', supplierCost: '', shippingWeightGrams: '1000', shippingLengthCm: '30', shippingWidthCm: '20', shippingHeightCm: '10', bulkySurcharge: '0', deliveryOverride: '' })
  const [manualImage, setManualImage] = useState<File | null>(null)
  const [productSearch, setProductSearch] = useState('')
  const [productCategory, setProductCategory] = useState('All categories')
  const [productStatus, setProductStatus] = useState('All statuses')

  async function load() {
    const response = await fetch('/api/dashboard')
    if (response.ok) setData(await response.json())
    else setMessage('The dashboard could not connect to the main control API.')
  }

  useEffect(() => { load() }, [])

  function listingDetails(item: Opportunity): ListingDraft {
    return listingDrafts[item.id] || {
      price: typeof item.proposed_product?.retail_price_cents === 'number' ? (item.proposed_product.retail_price_cents / 100).toFixed(2) : '',
      imageUrl: item.proposed_product?.image_url || '',
    }
  }

  function updateListingDraft(item: Opportunity, field: keyof ListingDraft, value: string) {
    setListingDrafts(current => ({ ...current, [item.id]: { ...listingDetails(item), ...current[item.id], [field]: value } }))
  }

  async function control(payload: Record<string, unknown>) {
    const response = await fetch('/api/dashboard', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    return { response, result: await response.json().catch(() => ({})) as { error?: string; message?: string; opportunityId?: string; retailPriceCents?: number; category?: string; requiresHumanAction?: boolean; processed?: boolean; retryScheduled?: boolean; attempt?: number; maximumAttempts?: number } }
  }

  async function queueDiscovery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('Queuing research…')
    const { response, result } = await control({ action: 'queue-discovery', demandSignal })
    if (!response.ok) { setMessage(result.error || 'Could not queue research.'); return }
    setDemandSignal('')
    await runAutomation()
  }

  async function runAutomation() {
    setMessage('Running automation…')
    for (let retry = 0; retry < 3; retry += 1) {
      const { response, result } = await control({ action: 'run-automation' })
      if (!response.ok) { setMessage(result.error || 'Automation could not run.'); await load(); return }
      if (result.retryScheduled) {
        setMessage(`Temporary issue detected. Retrying automatically (${result.attempt || retry + 1}/${result.maximumAttempts || 3})…`)
        await new Promise(resolve => window.setTimeout(resolve, 1000 * (retry + 1)))
        continue
      }
      setMessage(result.opportunityId ? 'Research completed. Review the opportunity below.' : result.requiresHumanAction ? 'Order monitoring completed. A delivery decision needs attention.' : result.processed ? 'Operations check completed.' : 'There are no queued automation tasks.')
      await load()
      return
    }
    setMessage('Automation is still retrying. Refresh shortly to see the final result.')
    await load()
    await load()
  }

  async function saveListingDetails(item: Opportunity) {
    const details = listingDetails(item)
    const retailPriceCents = Math.round(Number(details.price) * 100)
    setMessage('Saving listing details…')
    const { response, result } = await control({ action: 'update-opportunity-details', opportunityId: item.id, retailPriceCents, imageUrl: details.imageUrl })
    setMessage(response.ok ? 'Price and image saved. This listing is ready to approve.' : result.error || 'Could not save listing details.')
    if (response.ok) setListingDrafts(current => { const next = { ...current }; delete next[item.id]; return next })
    await load()
  }

  async function enrichListing(item: Opportunity) {
    setMessage('Checking the supplier page for its image and price…')
    const { response, result } = await control({ action: 'enrich-opportunity-listing', opportunityId: item.id })
    setMessage(response.ok ? 'Supplier details found. Review the calculated selling price, then approve when ready.' : result.error || 'Could not retrieve details from the supplier page.')
    if (response.ok) setListingDrafts(current => { const next = { ...current }; delete next[item.id]; return next })
    await load()
  }

  async function approve(item: Opportunity) {
    const details = listingDetails(item)
    const retailPriceCents = Math.round(Number(details.price) * 100)
    if (!Number.isInteger(retailPriceCents) || retailPriceCents <= 0 || !details.imageUrl.trim()) {
      setMessage('Add a confirmed price and supplier image before approving this listing.')
      return
    }
    setMessage('Approving opportunity…')
    const { response, result } = await control({ action: 'approve-opportunity', opportunityId: item.id })
    setMessage(response.ok ? 'Opportunity approved and published.' : result.error || 'Approval failed.')
    await load()
  }

  async function retry(taskId: string) {
    setMessage('Preparing the task to retry…')
    const { response, result } = await control({ action: 'retry-task', taskId })
    setMessage(response.ok ? 'Task is ready to run again.' : result.error || 'This task cannot be retried yet.')
    await load()
  }

  async function discard(eventId: string) {
    setMessage('Discarding dashboard alert…')
    const { response, result } = await control({ action: 'discard-attention', eventId })
    setMessage(response.ok ? 'Alert discarded from the active dashboard.' : result.error || 'The alert could not be discarded.')
    await load()
  }

  function fulfilmentDetails(delivery: FulfilmentDelivery, supplierCostCents?: number | null): FulfilmentDraft {
    return fulfilmentDrafts[delivery.id] || { supplierReference: delivery.supplier_reference || delivery.internal_reference || '', procurementUrl: delivery.procurement_url || '', procurementCost: typeof delivery.procurement_cost_cents === 'number' ? (delivery.procurement_cost_cents / 100).toFixed(2) : typeof supplierCostCents === 'number' ? (supplierCostCents / 100).toFixed(2) : typeof delivery.supplier_cost_cents === 'number' ? (delivery.supplier_cost_cents / 100).toFixed(2) : '', notes: '', trackingNumber: delivery.tracking_number || '', carrier: delivery.carrier || '' }
  }

  function updateFulfilmentDraft(delivery: FulfilmentDelivery, field: keyof FulfilmentDraft, value: string, supplierCostCents?: number | null) {
    setFulfilmentDrafts(current => ({ ...current, [delivery.id]: { ...fulfilmentDetails(delivery, supplierCostCents), ...current[delivery.id], [field]: value } }))
  }

  async function fulfilmentAction(action: string, delivery: FulfilmentDelivery) {
    if (action === 'cancel-order' && !window.confirm('Cancel this order and flag it for refund review? This cannot be undone from the dashboard.')) return
    const details = fulfilmentDetails(delivery)
    setMessage('Updating fulfilment…')
    const { response, result } = await control({ action, deliveryId: delivery.id, supplierReference: details.supplierReference, procurementUrl: details.procurementUrl, procurementCostCents: Math.round(Number(details.procurementCost) * 100), notes: details.notes, trackingNumber: details.trackingNumber, carrier: details.carrier })
    setMessage(response.ok ? result.message || 'Fulfilment updated.' : result.error || 'Could not update fulfilment.')
    await load()
  }

  async function createManualProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!manualImage) { setMessage('Choose a product image first.'); return }
    setMessage('Uploading product image…')
    const uploadData = new FormData()
    uploadData.append('image', manualImage)
    const upload = await fetch('/api/dashboard/upload', { method: 'POST', body: uploadData })
    const uploaded = await upload.json().catch(() => ({}))
    if (!upload.ok || typeof uploaded.imageUrl !== 'string') { setMessage(uploaded.error || 'Image upload failed.'); return }
    setMessage('Creating manual product…')
    const supplierCostCents = Math.round(Number(manualProduct.supplierCost) * 100)
    const { response, result } = await control({ action: 'create-manual-product', ...manualProduct, supplierCostCents, imageUrl: uploaded.imageUrl })
    setMessage(response.ok ? `Manual product published at R${(Number(result.retailPriceCents) / 100).toFixed(2)} in ${result.category || 'Other'}.` : result.error || 'Could not create manual product.')
    if (response.ok) { setManualProduct({ name: '', description: '', category: '', supplierName: '', supplierContact: '', supplierPhone: '', supplierUrl: '', supplierCost: '', shippingWeightGrams: '1000', shippingLengthCm: '30', shippingWidthCm: '20', shippingHeightCm: '10', bulkySurcharge: '0', deliveryOverride: '' }); setManualImage(null) }
    await load()
  }

  const cards = data ? [['Suppliers', data.metrics.suppliers], ['Active promotions', data.metrics.activePromotions], ['Successful payments', data.metrics.successfulPayments], ['Automation queue', data.metrics.queuedTasks]] : []
  const managedProducts = (data?.products || []).filter(product => (productStatus === 'All statuses' || product.lifecycle_status === productStatus) && (productCategory === 'All categories' || normalizedManualCategory(product.category || '') === productCategory) && product.name.toLowerCase().includes(productSearch.trim().toLowerCase()))

  return <main className="mx-auto max-w-7xl px-5 py-10">
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div><p className="font-semibold text-green">CONNECTNETWORK</p><h1 className="text-3xl font-bold">Operations dashboard</h1><p className="mt-2 text-slate-600">Review important decisions while automation handles repeatable work.</p></div>
      <div className="flex flex-wrap gap-3"><button onClick={runAutomation} className="rounded-lg bg-green px-4 py-2 text-sm font-semibold text-white">Run automation now</button><a className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium" href={process.env.NEXT_PUBLIC_WEBSITE_URL || 'http://localhost:3000'}>View public site</a><form action="/api/auth/signout" method="post"><button className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700" type="submit">Sign out</button></form></div>
    </header>
    {message && <p className="mt-5 rounded-lg border border-slate-300 bg-slate-50 p-4 text-sm" role="status">{message}</p>}
    <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{cards.map(([label, value]) => <article className="rounded-xl border bg-white p-5 shadow-sm" key={String(label)}><p className="text-sm text-slate-600">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p></article>)}</section>
    <section className="mt-8 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
      <form onSubmit={queueDiscovery} className="rounded-xl border bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">Research a demand signal</h2><p className="mt-2 text-sm text-slate-600">Ask the OpenAI worker to prepare an opportunity for your review.</p><textarea required minLength={10} value={demandSignal} onChange={event => setDemandSignal(event.target.value)} className="mt-5 min-h-32 w-full rounded-lg border p-3" placeholder="Example: affordable backup power for small South African businesses" /><button className="mt-4 rounded-lg bg-navy px-4 py-2 font-semibold text-white">Queue research</button></form>
      <section><h2 className="text-xl font-bold">Ready for review</h2><div className="mt-4 grid gap-4">{data?.opportunities.map(item => {
        const details = listingDetails(item)
        const priceValid = Number.isFinite(Number(details.price)) && Number(details.price) > 0
        const imageValid = /^https?:\/\/.+/i.test(details.imageUrl.trim())
        const supplierCost = item.proposed_product?.supplier_cost_cents
        const markup = item.proposed_product?.markup_percent
        return <article className="rounded-xl border bg-white p-5 shadow-sm" key={item.id}><h3 className="font-bold">{item.title}</h3><p className="mt-2 text-sm text-slate-600">{item.demand_summary || 'No demand summary provided.'}</p><p className="mt-3 text-sm">Supplier: {item.proposed_supplier?.business_name || 'Not prepared'} · Product: {item.proposed_product?.name || 'Not prepared'}</p>{item.source_url && <a className="mt-3 inline-block text-sm text-navy underline" href={item.source_url} target="_blank" rel="noreferrer">Open research source</a>}<div className="mt-5 grid gap-3 border-t pt-4 sm:grid-cols-2"><label className="text-sm font-medium">Selling price (R)<input type="number" min="0.01" step="0.01" value={details.price} onChange={event => updateListingDraft(item, 'price', event.target.value)} className="mt-1 block w-full rounded-lg border p-2" placeholder="e.g. 499.00" /></label><label className="text-sm font-medium">Supplier image URL<input type="url" value={details.imageUrl} onChange={event => updateListingDraft(item, 'imageUrl', event.target.value)} className="mt-1 block w-full rounded-lg border p-2" placeholder="https://..." /></label></div>{typeof supplierCost === 'number' && <p className="mt-2 text-sm text-slate-600">Supplier/source price: R{(supplierCost / 100).toFixed(2)} · Markup: {typeof markup === 'number' ? `${markup}%` : '25%'}</p>}<p className="mt-2 text-sm text-slate-600">{priceValid && imageValid ? 'Listing details are complete.' : 'A confirmed price and supplier image are required before publishing.'}</p><div className="mt-4 flex flex-wrap gap-3"><button onClick={() => enrichListing(item)} className="rounded-lg border border-navy px-4 py-2 font-semibold text-navy">Get supplier image and apply markup</button><button onClick={() => saveListingDetails(item)} className="rounded-lg border border-navy px-4 py-2 font-semibold text-navy">Save details</button><button disabled={!priceValid || !imageValid} onClick={() => approve(item)} className="rounded-lg bg-green px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">Approve and publish</button></div></article>
      })}{data && data.opportunities.length === 0 && <p className="rounded-xl border bg-white p-5 text-slate-600">No opportunities are waiting for approval.</p>}</div></section>
    </section>
    <section className="mt-8 rounded-xl border bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">Add manual product</h2><p className="mt-2 text-sm text-slate-600">For informal suppliers. Upload the image and enter their cost; ConnectNetwork applies the standard 25% markup.</p><form className="mt-5 grid gap-3 md:grid-cols-2" onSubmit={createManualProduct}><input required value={manualProduct.name} onChange={event => setManualProduct(current => ({ ...current, name: event.target.value }))} className="rounded-lg border p-3" placeholder="Product name" /><input required value={manualProduct.supplierName} onChange={event => setManualProduct(current => ({ ...current, supplierName: event.target.value }))} className="rounded-lg border p-3" placeholder="Supplier name" /><select value={normalizedManualCategory(manualProduct.category)} onChange={event => setManualProduct(current => ({ ...current, category: event.target.value }))} className="rounded-lg border p-3"><option value="Other">Category</option>{manualCategories.map(category => <option key={category} value={category}>{category}</option>)}</select><input required type="number" min="0" step="0.01" value={manualProduct.supplierCost} onChange={event => setManualProduct(current => ({ ...current, supplierCost: event.target.value }))} className="rounded-lg border p-3" placeholder="Supplier cost (R)" /><input value={manualProduct.supplierContact} onChange={event => setManualProduct(current => ({ ...current, supplierContact: event.target.value }))} className="rounded-lg border p-3" placeholder="Supplier contact name" /><input value={manualProduct.supplierPhone} onChange={event => setManualProduct(current => ({ ...current, supplierPhone: event.target.value }))} className="rounded-lg border p-3" placeholder="Supplier phone" /><input value={manualProduct.supplierUrl} onChange={event => setManualProduct(current => ({ ...current, supplierUrl: event.target.value }))} className="rounded-lg border p-3" placeholder="Supplier URL (optional)" /><input required type="file" accept="image/*" onChange={event => setManualImage(event.target.files?.[0] || null)} className="rounded-lg border p-3" /><textarea value={manualProduct.description} onChange={event => setManualProduct(current => ({ ...current, description: event.target.value }))} className="min-h-24 rounded-lg border p-3 md:col-span-2" placeholder="Product description" /><fieldset className="grid gap-3 rounded-lg border p-4 md:col-span-2"><legend className="px-1 text-sm font-semibold">Shipping details</legend><p className="text-xs text-slate-600">These are used internally to calculate delivery per supplier shipment.</p><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><input required type="number" min="1" step="1" value={manualProduct.shippingWeightGrams} onChange={event => setManualProduct(current => ({ ...current, shippingWeightGrams: event.target.value }))} className="rounded-lg border p-3" placeholder="Weight (g)" /><input required type="number" min="0.01" step="0.01" value={manualProduct.shippingLengthCm} onChange={event => setManualProduct(current => ({ ...current, shippingLengthCm: event.target.value }))} className="rounded-lg border p-3" placeholder="Length (cm)" /><input required type="number" min="0.01" step="0.01" value={manualProduct.shippingWidthCm} onChange={event => setManualProduct(current => ({ ...current, shippingWidthCm: event.target.value }))} className="rounded-lg border p-3" placeholder="Width (cm)" /><input required type="number" min="0.01" step="0.01" value={manualProduct.shippingHeightCm} onChange={event => setManualProduct(current => ({ ...current, shippingHeightCm: event.target.value }))} className="rounded-lg border p-3" placeholder="Height (cm)" /></div><div className="grid gap-3 sm:grid-cols-2"><input type="number" min="0" step="0.01" value={manualProduct.bulkySurcharge} onChange={event => setManualProduct(current => ({ ...current, bulkySurcharge: event.target.value }))} className="rounded-lg border p-3" placeholder="Bulky surcharge (R, optional)" /><input type="number" min="0" step="0.01" value={manualProduct.deliveryOverride} onChange={event => setManualProduct(current => ({ ...current, deliveryOverride: event.target.value }))} className="rounded-lg border p-3" placeholder="Delivery override per supplier shipment (R, optional)" /></div></fieldset><div className="md:col-span-2"><p className="text-sm text-slate-600">Customer price: {Number(manualProduct.supplierCost) > 0 ? `R${(Number(manualProduct.supplierCost) * 1.25).toFixed(2)}` : 'Enter supplier cost'}</p><button className="mt-3 rounded-lg bg-green px-4 py-2 font-semibold text-white">Upload and publish product</button></div></form></section>
    <section className="mt-8"><h2 className="text-xl font-bold">Fulfilment queue</h2><p className="mt-2 text-sm text-slate-600">Paid orders stay here until a team member verifies the supplier and places the order. Tracking will update automatically when the courier connection is enabled.</p><div className="mt-4 grid gap-4">{data?.orders.map(order => <article className="rounded-xl border bg-white p-5 shadow-sm" key={order.id}><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-bold">Order {order.id.slice(0, 8)} · R{(order.total_cents / 100).toFixed(2)}</h3><p className="mt-1 text-sm text-slate-600">{order.customer_email || 'No customer email'} · {order.status}</p><p className="mt-2 text-sm"><strong>Deliver to:</strong> {order.delivery_address ? `${order.delivery_address.line1 || ''}, ${order.delivery_address.suburb || ''}, ${order.delivery_address.city || ''} ${order.delivery_address.postalCode || ''}` : 'Address not captured'} · {order.delivery_phone || 'No phone number'}</p>{order.delivery_address?.mapUrl && <a className="mt-1 inline-block text-sm text-navy underline" href={order.delivery_address.mapUrl} target="_blank" rel="noreferrer">Open customer location</a>}<p className="mt-1 text-sm text-slate-600">Customer delivery fee: {typeof order.delivery_fee_cents === 'number' ? `R${(order.delivery_fee_cents / 100).toFixed(2)}` : 'Not recorded'}</p><p className="mt-1 text-sm text-slate-600">Courier cost: {typeof order.delivery_quote_cents === 'number' ? `R${(order.delivery_quote_cents / 100).toFixed(2)}` : 'To be confirmed when ordered'}</p></div></div>{order.deliveries.map(delivery => { const item = order.items.find(entry => entry.supplier_id === delivery.supplier_id); const supplier = item?.products?.suppliers; const supplierRecord = Array.isArray(supplier) ? supplier[0] : supplier; const details = fulfilmentDetails(delivery); const saleCents = item ? item.unit_price_cents * item.quantity : 0; const hasCost = details.procurementCost.trim() !== '' && Number.isFinite(Number(details.procurementCost)); const costCents = hasCost ? Math.round(Number(details.procurementCost) * 100) : null; const profit = costCents !== null && costCents >= 0 ? saleCents - costCents : null; return <div className="mt-5 rounded-lg border bg-slate-50 p-4" key={delivery.id}><p className="font-semibold">{item?.product_name || 'Supplier item'} · {supplierRecord?.business_name || 'Supplier'}</p>{(supplierRecord?.source_url || supplierRecord?.website_url) && <a className="mt-1 inline-block text-sm text-navy underline" href={supplierRecord.source_url || supplierRecord.website_url} target="_blank" rel="noreferrer">Open supplier page</a>}<p className="mt-2 text-sm">Product income: R{(saleCents / 100).toFixed(2)}{profit !== null ? ` · Estimated product profit: R${(profit / 100).toFixed(2)}` : ' · Enter supplier cost to check profit.'}</p><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3"><input value={details.supplierReference} onChange={event => updateFulfilmentDraft(delivery, 'supplierReference', event.target.value)} className="rounded border p-2 text-sm" placeholder="Supplier order reference" /><input value={details.procurementUrl} onChange={event => updateFulfilmentDraft(delivery, 'procurementUrl', event.target.value)} className="rounded border p-2 text-sm" placeholder="Supplier order URL" /><input type="number" min="0" step="0.01" value={details.procurementCost} onChange={event => updateFulfilmentDraft(delivery, 'procurementCost', event.target.value)} className="rounded border p-2 text-sm" placeholder="Supplier cost (R)" /></div><div className="mt-3 flex flex-wrap gap-2"><button onClick={() => fulfilmentAction('mark-ordered', delivery)} className="rounded-lg bg-navy px-3 py-2 text-sm font-semibold text-white">Mark ordered</button><button onClick={() => fulfilmentAction('cancel-order', delivery)} className="rounded-lg border border-red-500 px-3 py-2 text-sm font-semibold text-red-700">Cancel & flag refund</button></div></div> })}</article>)}{data && data.orders.length === 0 && <p className="rounded-xl border bg-white p-5 text-slate-600">No paid orders are waiting for fulfilment.</p>}</div></section>
    <section className="mt-8"><h2 className="text-xl font-bold">Needs attention</h2><div className="mt-4 grid gap-4">{data?.attentionEvents.map(event => <article className="rounded-xl border border-amber-300 bg-amber-50 p-5" key={event.id}><div className="flex flex-wrap items-start justify-between gap-4"><div><h3 className="font-semibold">{event.event_type === 'automation_failed' ? 'Automation task failed' : 'Paid order needs dispatch'}</h3><p className="mt-2 text-sm text-slate-700">{event.payload?.message || (event.payload?.order_id ? `Order ${event.payload.order_id} is awaiting a delivery decision.` : 'Review this operational item before continuing.')}</p></div><div className="flex gap-2">{event.event_type === 'automation_failed' && event.task_id && <button onClick={() => retry(event.task_id!)} className="rounded-lg border border-amber-700 px-4 py-2 text-sm font-semibold text-amber-900">Retry task</button>}<button onClick={() => discard(event.id)} className="rounded-lg border border-slate-500 px-4 py-2 text-sm font-semibold text-slate-700">Discard</button></div></div></article>)}{data && data.attentionEvents.length === 0 && <p className="rounded-xl border bg-white p-5 text-slate-600">No errors or delivery decisions need attention.</p>}</div></section>
    {data && <ProductManagement products={data.products || []} onChanged={load} />}
    {data && <ProductMediaEditor products={data.products || []} onChanged={load} />}
    {data && <SupplierPurchaseLinks products={data.products || []} />}
    {data && <OpportunityCleanup opportunities={data.opportunities} onChanged={load} />}
    {data && <ProductCleanup products={data.products || []} onChanged={load} />}
    {data && <FulfilmentCompletion orders={data.orders} onChanged={load} />}
  </main>
}
