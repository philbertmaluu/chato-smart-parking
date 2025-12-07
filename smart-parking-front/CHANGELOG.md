# Changelog

## [1.1.0] - 2025-12-05

### Added
- **Flexible Vehicle Entry**: Vehicles can now be entered without a body type, with the option to set it on exit
- **Exit-based Pricing**: Pricing is now calculated on exit based on actual time spent
- **24-Hour Rolling Period Charging**: New charging model based on rolling 24-hour periods from entry time
- **Paid Pass Window Tracking**: Vehicles with active paid passes (within 24 hours) can exit without additional charges
- **Gate Control Integration**: Enhanced gate control features with hardware integration support
- **Thermal Printer Support**: Added support for Zy-Q822 thermal printers for receipt printing
- **Exit Pricing Preview**: New endpoint to preview exit pricing before processing exit
- **Enhanced Camera Detection**: Improved camera detection processing with better vehicle type handling

### Changed
- **Vehicle Model**: `body_type_id` is now nullable in the vehicles table
- **Pricing Calculation**: Moved from entry-based to exit-based pricing calculation
- **Charging Model**: Changed from hourly to daily (24-hour rolling periods) charging
- **Passage Processing**: Enhanced exit processing with better payment confirmation flow

### Fixed
- Resolved merge conflicts from main branch integration
- Fixed migration for nullable body_type_id
- Improved error handling in vehicle passage processing

### Technical
- Updated database schema to support nullable body_type_id
- Enhanced VehiclePassageService with new pricing preview functionality
- Improved TollService with simplified toll system
- Updated ReceiptRepository with 24-hour period receipt checking

---

## [1.0.0] - Initial Release

### Features
- Vehicle entry and exit management
- Camera-based plate detection
- Basic toll calculation
- Receipt generation
- Operator dashboard
- Manager dashboard

