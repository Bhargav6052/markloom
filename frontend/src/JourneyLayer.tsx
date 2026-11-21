import {flowImages} from './FlowNavigation';
/** A decorative moving representation; native links and all content remain in document flow. */
export default function JourneyLayer(){return <div className="journey-flight-layer" aria-hidden="true">{flowImages.map(image=><div key={image.id} className="journey-flight-card" data-stage={image.id}><img src={image.image} alt="" width={image.width} height={image.height} decoding="async" draggable={false}/><span>{image.name}</span></div>)}</div>}
