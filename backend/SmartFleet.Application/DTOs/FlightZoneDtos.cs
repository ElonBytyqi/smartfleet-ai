using System;
using System.Collections.Generic;
using System.Text;


    namespace SmartFleet.Application.DTOs;

    public record CreateFlightZoneRequest(
        string Name,
        string ZoneType,
        string PolygonGeoJson,
        bool IsRestricted,
        int? MaxAltitudeMeters);

    public record UpdateFlightZoneRequest(
        string Name,
        string ZoneType,
        string PolygonGeoJson,
        bool IsRestricted,
        int? MaxAltitudeMeters);

    public record FlightZoneResponse(
        Guid Id,
        string Name,
        string ZoneType,
        string PolygonGeoJson,
        bool IsRestricted,
        int? MaxAltitudeMeters,
        int MissionCount);

