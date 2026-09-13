# ---- Build stage: restore + publish a self-contained release ----
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Restore first (layer cached while the csproj is unchanged).
COPY MmcTaxiApi.csproj ./
RUN dotnet restore

# Build + publish the release output.
COPY . ./
RUN dotnet publish -c Release -o /app/publish --no-restore

# ---- Runtime stage: small ASP.NET image, no SDK ----
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

# Production defaults. URLs/connection string/JWT are supplied by compose.
ENV ASPNETCORE_ENVIRONMENT=Production \
    ASPNETCORE_URLS=http://+:8080

# Uploaded driver documents / vehicle photos live here (mounted volume in compose).
RUN mkdir -p /app/Uploads

COPY --from=build /app/publish ./
EXPOSE 8080
ENTRYPOINT ["dotnet", "MmcTaxiApi.dll"]
