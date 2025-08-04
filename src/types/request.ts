export interface PropertyData {
    title: string;
    address: string;
    [key: string]: any;
  }
  
  export interface UserData {
    displayName: string;
    email: string;
    [key: string]: any;
  }
  
  export interface BaseRequest {
    id: string;
    propertyId: string;
    tenantId: string;
    landlordId: string;
    status: 'pending' | 'approved' | 'denied';
    message: string;
    createdAt: Date;
    property: PropertyData;
  }
  
  // For landlord's view
  export interface RequestWithTenant extends BaseRequest {
    tenant: UserData;
  }
  
  // For tenant's view
  export interface RequestWithLandlord extends BaseRequest {
    landlord: {
      displayName: string;
      email: string;
    };
  }
  
  // Union type for the request item
  export type RequestItemData = RequestWithTenant | RequestWithLandlord;