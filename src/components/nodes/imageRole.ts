import { NodeData } from '../../store/types';
import { isImageValue } from '../../store/nodeUtils';

// the image travelling in on the node's single input handle, if any
export const incomingImageOf = (data: NodeData): string => data.inputValues[data.inputHandles[0]?.id ?? ''] ?? '';

// a loader holds its own uploaded image and has nothing feeding it, so it emits downstream
export const imageLoaderActive = (data: NodeData, hasIncomingEdge: boolean): boolean =>
  !hasIncomingEdge && isImageValue(data.text);

// whether the node currently shows an image (its own or an incoming one) rather than the upload prompt
export const showsImageContent = (data: NodeData, hasIncomingEdge: boolean): boolean =>
  imageLoaderActive(data, hasIncomingEdge) || (hasIncomingEdge && isImageValue(incomingImageOf(data)));
