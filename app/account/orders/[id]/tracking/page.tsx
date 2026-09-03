import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Package, Truck } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Container } from '@/components/ui/Container';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface Props { params: Promise<{ id: string }> }

export default async function TrackingPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();
  const { data: order } = await supabase.from('orders').select('id,order_number,status').eq('id', id).eq('customer_id', user.id).maybeSingle();
  if (!order) notFound();
  const { data: shipments } = await supabase.from('shipments').select('id,seller_id,status,carrier,tracking_number,shipped_at,delivered_at').eq('order_id', id).order('created_at');
  const shipmentIds = (shipments || []).map((shipment) => shipment.id);
  const { data: events } = shipmentIds.length ? await supabase.from('shipment_events').select('id,shipment_id,status,location,description,event_at').in('shipment_id', shipmentIds).order('event_at', { ascending: false }) : { data: [] };

  return <main className="min-h-screen bg-gray-50 py-8"><Container size="lg">
    <Link href={`/account/orders/${id}`} className="mb-6 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"><ArrowLeft size={16} /> Back to order</Link>
    <div className="mb-6"><h1 className="text-3xl font-bold text-gray-900">Track {order.order_number}</h1><p className="mt-1 text-sm text-gray-500">Live shipment events recorded by the marketplace.</p></div>
    {shipments?.length ? <div className="space-y-5">{shipments.map((shipment) => <Card key={shipment.id}><CardContent className="p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-[#0f2b5b]"><Truck size={19} /></div><div><p className="font-semibold text-gray-900">Shipment</p><p className="text-xs text-gray-500">{shipment.carrier || 'Marketplace delivery'}{shipment.tracking_number ? ` · ${shipment.tracking_number}` : ''}</p></div></div><Badge variant={shipment.status === 'delivered' ? 'success' : 'primary'}>{shipment.status.replaceAll('_',' ')}</Badge></div><div className="mt-6 space-y-4">{(events || []).filter((event) => event.shipment_id === shipment.id).map((event, index) => <div key={event.id} className="flex gap-3"><div className="flex flex-col items-center"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100"><CheckCircle2 size={15} /></div>{index < (events || []).filter((e) => e.shipment_id === shipment.id).length - 1 && <div className="mt-1 h-8 w-px bg-gray-200" />}</div><div><p className="text-sm font-medium capitalize text-gray-900">{event.status.replaceAll('_',' ')}</p><p className="text-xs text-gray-500">{event.description || 'Shipment updated'}{event.location ? ` · ${event.location}` : ''}</p><p className="mt-1 text-[11px] text-gray-400">{new Date(event.event_at).toLocaleString()}</p></div></div>)}{!(events || []).some((event) => event.shipment_id === shipment.id) && <p className="text-sm text-gray-500">Shipment created; tracking events will appear here as fulfillment progresses.</p>}</div></CardContent></Card>)}</div> : <Card><CardContent className="p-8 text-center"><Package className="mx-auto text-gray-400" size={30} /><p className="mt-3 font-medium">Shipment not created yet</p><p className="mt-1 text-sm text-gray-500">Tracking becomes available when the seller starts fulfillment.</p></CardContent></Card>}
  </Container></main>;
}
